// =============================================
// SUPABASE CONFIGURATION
// =============================================
const SUPABASE_URL = "https://ofjtwbiorpylsegipgzo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manR3YmlvcnB5bHNlZ2lwZ3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDk3NjMsImV4cCI6MjA5MDcyNTc2M30.c0u43yD2vJdYdk7oeqJDZXWUgzDOI-TIrAHd1HTRM10";

const supabaseClient =
  typeof supabase !== "undefined"
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// =============================================
// DOM ELEMENTS
// =============================================
const emergencyCard = document.querySelector(".card");
const urgencyButtons = document.querySelectorAll(".urgency button");
const submitBtn = document.querySelector(".submit-btn");

const patientNameInput = document.querySelector(
  '.input-group input[placeholder="e.g. John Doe"]'
);
const hospitalInput = document.querySelector(
  '.input-group input[placeholder="Search hospital or clinic..."]'
);
const bloodTypeSelect = document.querySelectorAll(".input-group select")[0];
const unitsSelect = document.querySelectorAll(".input-group select")[1];
const notesTextarea = document.querySelector("textarea");

let selectedUrgency = "Urgent";
let statusMessageEl = null;
const PENDING_REQUESTS_KEY = "vital_stream_pending_emergencies";
const EMERGENCY_PREFILL_KEY = "vital_stream_emergency_prefill";

function ensureStatusMessage() {
  if (!statusMessageEl) {
    statusMessageEl = document.createElement("p");
    statusMessageEl.className = "form-status";
    submitBtn.insertAdjacentElement("afterend", statusMessageEl);
  }
  return statusMessageEl;
}

function showStatus(message, type) {
  const el = ensureStatusMessage();
  el.textContent = message;
  el.classList.remove("is-success", "is-error", "is-info");
  el.classList.add(`is-${type}`);
}

function clearStatus() {
  const el = ensureStatusMessage();
  el.textContent = "";
  el.classList.remove("is-success", "is-error", "is-info");
}

function loadPendingRequests() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_REQUESTS_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function savePendingRequests(requests) {
  localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(requests));
}

function addPendingRequest(payload) {
  const pending = loadPendingRequests();
  pending.push({
    payload,
    savedAt: new Date().toISOString(),
  });
  savePendingRequests(pending);
}

async function insertRequest(payload) {
  const { error } = await supabaseClient.from("emergency_requests").insert([payload]);
  if (error) throw error;
}

async function syncPendingRequests() {
  if (!supabaseClient) return;

  const pending = loadPendingRequests();
  if (pending.length === 0) return;

  let syncedCount = 0;
  const stillPending = [];

  for (const item of pending) {
    try {
      await insertRequest(item.payload);
      syncedCount += 1;
    } catch (error) {
      stillPending.push(item);
    }
  }

  savePendingRequests(stillPending);

  if (syncedCount > 0) {
    showStatus(
      `${syncedCount} pending request(s) synced successfully.`,
      "success"
    );
  }
}

// =============================================
// URGENCY TOGGLE UI
// =============================================
function updateUrgencyStyles(level) {
  emergencyCard.classList.remove(
    "urgency-normal",
    "urgency-urgent",
    "urgency-critical"
  );

  if (level === "Normal") {
    emergencyCard.classList.add("urgency-normal");
  } else if (level === "Critical") {
    emergencyCard.classList.add("urgency-critical");
  } else {
    emergencyCard.classList.add("urgency-urgent");
  }
}

urgencyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    urgencyButtons.forEach((btn) => btn.classList.remove("active"));
    urgencyButtons.forEach((btn) =>
      btn.classList.remove("active-normal", "active-urgent", "active-critical")
    );
    button.classList.add("active");
    selectedUrgency = button.textContent.trim();
    button.classList.add(`active-${selectedUrgency.toLowerCase()}`);
    updateUrgencyStyles(selectedUrgency);
  });
});

updateUrgencyStyles(selectedUrgency);

// =============================================
// VALIDATION
// =============================================
function validateEmergencyForm() {
  const patientName = patientNameInput.value.trim();
  const hospitalName = hospitalInput.value.trim();
  const bloodType = bloodTypeSelect.value;

  if (!patientName) {
    showStatus("Please enter patient name.", "error");
    patientNameInput.focus();
    return false;
  }

  if (!hospitalName) {
    showStatus("Please enter hospital location.", "error");
    hospitalInput.focus();
    return false;
  }

  if (bloodType === "Select Type") {
    showStatus("Please select blood type.", "error");
    bloodTypeSelect.focus();
    return false;
  }

  return true;
}

// =============================================
// SUBMIT TO SUPABASE
// =============================================
async function submitEmergencyRequest() {
  clearStatus();

  if (!validateEmergencyForm()) return;

  if (!supabaseClient) {
    showStatus(
      "Supabase library is not loaded. Add Supabase script before emargancy.js.",
      "error"
    );
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "BROADCASTING...";
  showStatus("Sending emergency request...", "info");

  const payload = {
    hospital_name: hospitalInput.value.trim(),
    blood_type: bloodTypeSelect.value,
    urgency_level: selectedUrgency,
    status: "Pending",
  };

  // Keep beginner-friendly: store extra details in notes text.
  const notes = notesTextarea.value.trim();
  const patientName = patientNameInput.value.trim();
  const unitsNeeded = unitsSelect.value.trim();
  if (notes) {
    payload.hospital_name = `${payload.hospital_name} | Patient: ${patientName} | Units: ${unitsNeeded} | Notes: ${notes}`;
  } else {
    payload.hospital_name = `${payload.hospital_name} | Patient: ${patientName} | Units: ${unitsNeeded}`;
  }

  try {
    await insertRequest(payload);

    showStatus("Emergency request broadcasted successfully.", "success");
    clearForm();
  } catch (error) {
    console.error("Emergency request failed:", error);
    const rawMessage = String(error?.message || "");
    let userMessage = "Failed to broadcast request. Please try again.";

    if (
      rawMessage.includes("Failed to fetch") ||
      rawMessage.includes("ERR_NAME_NOT_RESOLVED") ||
      rawMessage.includes("NetworkError")
    ) {
      addPendingRequest(payload);
      userMessage =
        "Network error: request saved locally and will sync when connection returns.";
    } else if (rawMessage.toLowerCase().includes("permission")) {
      userMessage =
        "Permission error: check Supabase RLS policy for emergency_requests.";
    } else if (rawMessage.toLowerCase().includes("invalid")) {
      userMessage = "Invalid request data. Please review input values.";
    } else if (rawMessage) {
      userMessage = `Failed to broadcast request: ${rawMessage}`;
    }

    showStatus(userMessage, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "BROADCAST REQUEST";
  }
}

function clearForm() {
  patientNameInput.value = "";
  hospitalInput.value = "";
  bloodTypeSelect.selectedIndex = 0;
  unitsSelect.selectedIndex = 0;
  notesTextarea.value = "";
}

function setUrgencyLevel(level) {
  const normalized = String(level || "").toLowerCase();
  const matchedButton = Array.from(urgencyButtons).find(
    (btn) => btn.textContent.trim().toLowerCase() === normalized
  );

  if (matchedButton) {
    matchedButton.click();
  }
}

function applyPrefillFromSearch() {
  const raw = localStorage.getItem(EMERGENCY_PREFILL_KEY);
  if (!raw) return;

  try {
    const prefill = JSON.parse(raw);

    if (prefill.hospital_name) {
      hospitalInput.value = prefill.hospital_name;
    }

    if (prefill.blood_type) {
      const bloodType = String(prefill.blood_type).toUpperCase();
      const matchedOption = Array.from(bloodTypeSelect.options).find(
        (option) => option.value.toUpperCase() === bloodType
      );
      if (matchedOption) {
        bloodTypeSelect.value = matchedOption.value;
      }
    }

    if (prefill.units_needed) {
      const unitsLabel = `${prefill.units_needed} Unit`;
      const unitsLabelPlural = `${prefill.units_needed} Units`;
      const matchedOption = Array.from(unitsSelect.options).find(
        (option) => option.value === unitsLabel || option.value === unitsLabelPlural
      );
      if (matchedOption) {
        unitsSelect.value = matchedOption.value;
      }
    }

    if (prefill.urgency_level) {
      setUrgencyLevel(prefill.urgency_level);
    }
  } catch (error) {
    console.warn("Could not apply emergency prefill:", error);
  } finally {
    localStorage.removeItem(EMERGENCY_PREFILL_KEY);
  }
}

submitBtn.addEventListener("click", submitEmergencyRequest);

ensureStatusMessage();
syncPendingRequests();
applyPrefillFromSearch();
