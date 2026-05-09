const SUPABASE_URL = "https://ofjtwbiorpylsegipgzo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manR3YmlvcnB5bHNlZ2lwZ3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDk3NjMsImV4cCI6MjA5MDcyNTc2M30.c0u43yD2vJdYdk7oeqJDZXWUgzDOI-TIrAHd1HTRM10";

const fallbackHospitalData = [
  { blood: "A+", hospital: "City Hospital", distance: 2.4, units: 20, status: "Available", updated: "Updated recently" },
  { blood: "O-", hospital: "North Emergency Hospital", distance: 4.1, units: 2, status: "Critical", updated: "Updated recently" },
];

const hospitalGrid = document.getElementById("hospitalGrid");
const searchInput = document.getElementById("searchInput");
const emergencyToggle = document.getElementById("emergencyToggle");
const sortSelect = document.getElementById("sortSelect");
const resultsCount = document.getElementById("resultsCount");
const pagination = document.getElementById("pagination");
const resetFilters = document.getElementById("resetFilters");
const bloodButtons = document.querySelectorAll(".blood-btn");
const range = document.getElementById("distanceRange");
const distanceValue = document.getElementById("distanceValue");
const mapBtn = document.querySelector(".map-btn");
const searchBtn = document.querySelector(".search-btn");
const EMERGENCY_PREFILL_KEY = "vital_stream_emergency_prefill";

const PER_PAGE = 6;
let currentPage = 1;
let emergencyOnly = false;
let selectedBlood = null;
let selectedDistance = Number(range.value);
let hospitalData = [];
let latestFilteredData = [];

const supabaseClient =
  typeof supabase !== "undefined"
    ? supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("critical")) return "Critical";
  if (value.includes("low")) return "Low Stock";
  return "Available";
}

function formatUpdatedLabel(dateString) {
  const updatedAt = new Date(dateString);
  const diffMs = Date.now() - updatedAt.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Updated just now";
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays}d ago`;
}

function updateRangeTrack() {
  const value = Number(range.value);
  const percent = ((value - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100;
  range.style.background = `linear-gradient(to right, #B2182B ${percent}%, #E5E7EB ${percent}%)`;
}

function renderHospitals(data) {
  hospitalGrid.innerHTML = "";
  const totalPages = Math.ceil(data.length / PER_PAGE);
  pagination.style.display = totalPages <= 1 ? "none" : "flex";

  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * PER_PAGE;
  const end = start + PER_PAGE;
  const paginatedItems = data.slice(start, end);

  resultsCount.textContent = `${data.length} units`;

  if (paginatedItems.length === 0) {
    hospitalGrid.innerHTML = `
      <div class="hospital-card">
        <div class="card-top">
          <div class="hospital-info">
            <div>
              <h3>No inventory found</h3>
              <p>Try changing filters, distance, or check Supabase connection.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    renderPagination(totalPages, data);
    return;
  }

  paginatedItems.forEach((item) => {
    let badgeClass = "green";
    let bloodClass = "blood-red";
    if (item.status === "Low Stock") {
      badgeClass = "orange";
      bloodClass = "blood-orange";
    }
    if (item.status === "Critical") {
      badgeClass = "red";
      bloodClass = "blood-red";
    }

    const encodedHospital = encodeURIComponent(item.hospital);
    const buttonHTML =
      item.status === "Critical"
        ? `<button class="emergency-btn" data-hospital="${encodedHospital}" data-blood="${item.blood}" data-units="${item.units}">Emergency Request</button>`
        : `<button class="reserve-btn" data-hospital="${encodedHospital}" data-blood="${item.blood}" data-units="${item.units}">Request Reserve</button>`;

    hospitalGrid.innerHTML += `
      <div class="hospital-card">
        <div class="card-top">
          <div class="hospital-info">
            <div class="blood-icon ${bloodClass}">${item.blood}</div>
            <div>
              <h3>${item.hospital}</h3>
              <p><i class="fa-solid fa-location-dot"></i><span>${item.distance} km away</span></p>
            </div>
          </div>
          <div>
            <div class="badge ${badgeClass}">
              ${item.status === "Critical" ? `<span class="critical-icon"><i class="fa-solid fa-triangle-exclamation"></i></span>` : `●`}
              ${item.status}
            </div>
            <div class="updated">${item.updated}</div>
          </div>
        </div>
        <div class="card-bottom">
          <div>
            <div class="units">UNITS</div>
            <div class="amount">450ml x ${item.units}</div>
          </div>
          ${buttonHTML}
        </div>
      </div>
    `;
  });

  renderPagination(totalPages, data);
}

function openEmergencyPageWithPrefill(item, urgencyLevel) {
  localStorage.setItem(
    EMERGENCY_PREFILL_KEY,
    JSON.stringify({
      hospital_name: item.hospital,
      blood_type: item.blood,
      units_needed: item.units,
      urgency_level: urgencyLevel,
      savedAt: new Date().toISOString(),
    })
  );

  window.location.href = "../../Emergancy/emergancy.html";
}

function renderPagination(totalPages, data) {
  pagination.innerHTML = "";
  if (totalPages <= 1) return;

  pagination.innerHTML += `<div class="page prev-page"><i class="fa-solid fa-chevron-left"></i></div>`;
  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `<div class="page ${currentPage === i ? "active" : ""}" data-page="${i}">${i}</div>`;
  }
  pagination.innerHTML += `<div class="page next-page"><i class="fa-solid fa-chevron-right"></i></div>`;

  document.querySelectorAll("[data-page]").forEach((page) => {
    page.addEventListener("click", () => {
      currentPage = Number(page.dataset.page);
      renderHospitals(data);
    });
  });

  document.querySelector(".prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      renderHospitals(data);
    }
  });

  document.querySelector(".next-page").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      renderHospitals(data);
    }
  });
}

function filterHospitals() {
  const searchValue = searchInput.value.trim().toLowerCase();
  let filtered = [...hospitalData];

  if (selectedBlood) {
    filtered = filtered.filter((item) => item.blood === selectedBlood);
  }

  filtered = filtered.filter((item) => Number(item.distance) <= selectedDistance);

  if (searchValue) {
    filtered = filtered.filter((item) =>
      item.hospital.toLowerCase().includes(searchValue) || item.blood.toLowerCase().includes(searchValue)
    );
  }

  if (emergencyOnly) {
    filtered = filtered.filter((item) => item.status === "Critical");
  }

  const sortValue = sortSelect.value;
  if (sortValue === "closest") filtered.sort((a, b) => a.distance - b.distance);
  if (sortValue === "farthest") filtered.sort((a, b) => b.distance - a.distance);
  if (sortValue === "critical") {
    filtered.sort((a, b) => {
      if (a.status === "Critical" && b.status !== "Critical") return -1;
      if (b.status === "Critical" && a.status !== "Critical") return 1;
      return a.distance - b.distance;
    });
  }

  latestFilteredData = filtered;
  currentPage = 1;
  renderHospitals(filtered);
}

function openMapForNearestResult() {
  const list = latestFilteredData.length ? latestFilteredData : hospitalData;

  if (!list.length) {
    alert("No hospitals to show on map.");
    return;
  }

  const nearest = [...list].sort((a, b) => a.distance - b.distance)[0];
  const savedLocationRaw = localStorage.getItem("vital_stream_user_location");

  if (savedLocationRaw) {
    try {
      const savedLocation = JSON.parse(savedLocationRaw);
      if (savedLocation.latitude && savedLocation.longitude) {
        const origin = `${savedLocation.latitude},${savedLocation.longitude}`;
        const destination = encodeURIComponent(nearest.hospital);
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`,
          "_blank"
        );
        return;
      }
    } catch (error) {
      // Ignore parse errors and fallback to destination search only.
    }
  }

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nearest.hospital)}`,
    "_blank"
  );
}

async function loadInventoryFromSupabase() {
  // Running from file:// causes browser security limitations and inconsistent network behavior.
  if (window.location.protocol === "file:") {
    console.warn("Open this page via http://localhost, not file://");
    hospitalData = fallbackHospitalData;
    filterHospitals();
    return;
  }

  if (!supabaseClient) {
    hospitalData = fallbackHospitalData;
    filterHospitals();
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("inventory_units")
      .select("blood_type, units, status, location, distance_km, updated_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    hospitalData = (data || []).map((item) => ({
      blood: item.blood_type || "N/A",
      hospital: item.location || "Unknown Center",
      distance: Number(item.distance_km || 0),
      units: Number(item.units || 0),
      status: normalizeStatus(item.status),
      updated: formatUpdatedLabel(item.updated_at),
    }));

    if (hospitalData.length === 0) {
      hospitalData = fallbackHospitalData;
    }
  } catch (error) {
    console.error("Failed to load inventory from Supabase:", error);

    // Keep UX stable when DNS/project/network fails.
    const errorText = String(error?.message || "");
    if (
      errorText.includes("Failed to fetch") ||
      errorText.includes("ERR_NAME_NOT_RESOLVED") ||
      errorText.includes("NetworkError")
    ) {
      resultsCount.textContent = "Offline mode";
    }

    hospitalData = fallbackHospitalData;
  }

  filterHospitals();
}

searchInput.addEventListener("input", filterHospitals);
sortSelect.addEventListener("change", filterHospitals);
if (searchBtn) {
  searchBtn.addEventListener("click", filterHospitals);
}

emergencyToggle.addEventListener("click", () => {
  emergencyOnly = !emergencyOnly;
  emergencyToggle.classList.toggle("active");
  filterHospitals();
});

resetFilters.addEventListener("click", () => {
  selectedBlood = null;
  bloodButtons.forEach((btn) => btn.classList.remove("active"));
  selectedDistance = 50;
  range.value = 50;
  distanceValue.textContent = 50;
  updateRangeTrack();
  emergencyOnly = false;
  emergencyToggle.classList.remove("active");
  searchInput.value = "";
  sortSelect.value = "closest";
  currentPage = 1;
  filterHospitals();
});

bloodButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    bloodButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedBlood = btn.textContent.trim();
    filterHospitals();
  });
});

range.addEventListener("input", () => {
  selectedDistance = Number(range.value);
  distanceValue.textContent = range.value;
  updateRangeTrack();
  filterHospitals();
});

if (mapBtn) {
  mapBtn.addEventListener("click", openMapForNearestResult);
}

if (hospitalGrid) {
  hospitalGrid.addEventListener("click", (event) => {
    const reserveButton = event.target.closest(".reserve-btn");
    if (reserveButton) {
      openEmergencyPageWithPrefill(
        {
          hospital: decodeURIComponent(reserveButton.dataset.hospital || ""),
          blood: reserveButton.dataset.blood || "",
          units: Number(reserveButton.dataset.units || 1),
        },
        "Urgent"
      );
      return;
    }

    const emergencyButton = event.target.closest(".emergency-btn");
    if (emergencyButton) {
      openEmergencyPageWithPrefill(
        {
          hospital: decodeURIComponent(emergencyButton.dataset.hospital || ""),
          blood: emergencyButton.dataset.blood || "",
          units: Number(emergencyButton.dataset.units || 1),
        },
        "Critical"
      );
    }
  });
}

updateRangeTrack();
loadInventoryFromSupabase();