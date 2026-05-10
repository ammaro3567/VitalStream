const emergencyCard = document.querySelector(".card");
const urgencyButtons = document.querySelectorAll(".urgency button");
const submitBtn = document.querySelector(".submit-btn");

const patientNameInput = document.querySelector('.input-group input[placeholder="e.g. John Doe"]');
const hospitalInput = document.querySelector('.input-group input[placeholder="Search hospital or clinic..."]');
const bloodTypeSelect = document.querySelectorAll(".input-group select")[0];
const unitsSelect = document.querySelectorAll(".input-group select")[1];
const notesTextarea = document.querySelector("textarea");

let selectedUrgency = "Urgent";
let statusMessageEl = null;
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

function updateUrgencyStyles(level) {
  emergencyCard.classList.remove("urgency-normal", "urgency-urgent", "urgency-critical");

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
    urgencyButtons.forEach((btn) => btn.classList.remove("active-normal", "active-urgent", "active-critical"));
    button.classList.add("active");
    selectedUrgency = button.textContent.trim();
    button.classList.add(`active-${selectedUrgency.toLowerCase()}`);
    updateUrgencyStyles(selectedUrgency);
  });
});

updateUrgencyStyles(selectedUrgency);

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

function submitEmergencyRequest() {
  clearStatus();

  if (!validateEmergencyForm()) return;

  if (typeof VitalStreamDemo === "undefined") {
    showStatus("Demo data module missing.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "BROADCASTING...";
  showStatus("Sending emergency request...", "info");

  const payload = {
    hospital_name: hospitalInput.value.trim(),
    blood_type: bloodTypeSelect.value,
    urgency_level: selectedUrgency,
    status: "pending",
  };

  const notes = notesTextarea.value.trim();
  const patientName = patientNameInput.value.trim();
  const unitsNeeded = unitsSelect.value.trim();
  if (notes) {
    payload.hospital_name = `${payload.hospital_name} | Patient: ${patientName} | Units: ${unitsNeeded} | Notes: ${notes}`;
  } else {
    payload.hospital_name = `${payload.hospital_name} | Patient: ${patientName} | Units: ${unitsNeeded}`;
  }

  try {
    const db = VitalStreamDemo.load();
    const id = VitalStreamDemo.nextId(db, "emergency_requests");
    db.emergency_requests.push({
      id,
      hospital_name: payload.hospital_name,
      blood_type: payload.blood_type,
      urgency_level: payload.urgency_level,
      status: payload.status,
      created_at: new Date().toISOString(),
    });
    VitalStreamDemo.save(db);

    showStatus("Emergency request saved (demo). Open admin dashboard to see it.", "success");
    clearForm();
  } catch (error) {
    showStatus("Could not save request.", "error");
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
  } finally {
    localStorage.removeItem(EMERGENCY_PREFILL_KEY);
  }
}

submitBtn.addEventListener("click", submitEmergencyRequest);

ensureStatusMessage();
applyPrefillFromSearch();
