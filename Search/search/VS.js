const hospitalCards = document.getElementById("hospitalCards");
const searchInput = document.getElementById("searchInput");
const emergencyToggle = document.getElementById("emergencyToggle");
const sortSelect = document.getElementById("sortSelect");
const resultsCount = document.getElementById("resultsCount");
const resetFilters = document.getElementById("resetFilters");
const range = document.getElementById("distanceRange");
const distanceValue = document.getElementById("distanceValue");
const mapBtn = document.querySelector(".map-btn");
const searchBtn = document.querySelector(".search-btn");
const bloodButtons = document.querySelectorAll(".blood-btn");
const EMERGENCY_PREFILL_KEY = "vital_stream_emergency_prefill";

let emergencyOnly = false;
let selectedBlood = null;

function getCards() {
  const list = hospitalCards.querySelectorAll(".hospital-card");
  return Array.prototype.slice.call(list);
}

function sortVisibleCards() {
  const order = sortSelect.value;
  const frag = document.createDocumentFragment();
  const all = getCards();
  const visible = [];
  const hidden = [];
  for (let i = 0; i < all.length; i++) {
    if (all[i].classList.contains("is-hidden")) hidden.push(all[i]);
    else visible.push(all[i]);
  }
  visible.sort(function (a, b) {
    const da = Number(a.dataset.distance);
    const db = Number(b.dataset.distance);
    const sa = a.dataset.status;
    const sb = b.dataset.status;
    if (order === "closest") return da - db;
    if (order === "farthest") return db - da;
    if (order === "critical") {
      if (sa === "Critical" && sb !== "Critical") return -1;
      if (sb === "Critical" && sa !== "Critical") return 1;
      return da - db;
    }
    return 0;
  });
  for (let j = 0; j < visible.length; j++) frag.appendChild(visible[j]);
  for (let h = 0; h < hidden.length; h++) frag.appendChild(hidden[h]);
  hospitalCards.appendChild(frag);
}

function applyFilters() {
  const search = searchInput.value.trim().toLowerCase();
  const maxDist = Number(range.value);
  let visibleCount = 0;
  const cards = getCards();
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const d = Number(card.dataset.distance);
    const b = card.dataset.blood || "";
    const st = card.dataset.status || "";
    const hosp = (card.dataset.hospital || "").toLowerCase();
    let ok = d <= maxDist;
    if (selectedBlood) ok = ok && b === selectedBlood;
    if (search) ok = ok && (hosp.indexOf(search) !== -1 || b.toLowerCase().indexOf(search) !== -1);
    if (emergencyOnly) ok = ok && st === "Critical";
    if (ok) {
      card.classList.remove("is-hidden");
      visibleCount++;
    } else {
      card.classList.add("is-hidden");
    }
  }
  sortVisibleCards();
  resultsCount.textContent = visibleCount + " units";
}

function openEmergencyPageWithPrefill(item, urgencyLevel) {
  const obj = {
    hospital_name: item.hospital,
    blood_type: item.blood,
    units_needed: item.units,
    urgency_level: urgencyLevel,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(EMERGENCY_PREFILL_KEY, JSON.stringify(obj));
  window.location.href = "../../Emergancy/emergancy.html";
}

function openMapForNearestVisible() {
  const cards = getCards();
  const vis = [];
  for (let i = 0; i < cards.length; i++) {
    if (!cards[i].classList.contains("is-hidden")) vis.push(cards[i]);
  }
  if (!vis.length) {
    alert("No hospitals match the current filters.");
    return;
  }
  vis.sort(function (a, b) {
    return Number(a.dataset.distance) - Number(b.dataset.distance);
  });
  const nearest = vis[0];
  let name = nearest.dataset.hospital;
  const h3 = nearest.querySelector("h3");
  if (!name && h3) name = h3.textContent;
  if (!name) name = "Hospital";
  const savedLocationRaw = localStorage.getItem("vital_stream_user_location");
  if (savedLocationRaw) {
    try {
      const savedLocation = JSON.parse(savedLocationRaw);
      if (savedLocation.latitude && savedLocation.longitude) {
        const origin = savedLocation.latitude + "," + savedLocation.longitude;
        const destination = encodeURIComponent(name);
        window.open(
          "https://www.google.com/maps/dir/?api=1&origin=" +
            origin +
            "&destination=" +
            destination +
            "&travelmode=driving",
          "_blank"
        );
        return;
      }
    } catch (err) {}
  }
  window.open(
    "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(name),
    "_blank"
  );
}

function updateRangeTrack() {
  const value = Number(range.value);
  const min = Number(range.min);
  const max = Number(range.max);
  const percent = ((value - min) / (max - min)) * 100;
  range.style.background =
    "linear-gradient(to right, #B2182B " + percent + "%, #E5E7EB " + percent + "%)";
}

searchInput.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", applyFilters);
if (searchBtn) searchBtn.addEventListener("click", applyFilters);

emergencyToggle.addEventListener("click", function () {
  emergencyOnly = !emergencyOnly;
  emergencyToggle.classList.toggle("active");
  applyFilters();
});

resetFilters.addEventListener("click", function () {
  selectedBlood = null;
  for (let i = 0; i < bloodButtons.length; i++) {
    bloodButtons[i].classList.remove("active");
  }
  range.value = "15";
  distanceValue.textContent = "15";
  emergencyOnly = false;
  emergencyToggle.classList.remove("active");
  searchInput.value = "";
  sortSelect.value = "closest";
  updateRangeTrack();
  applyFilters();
});

const bloodRowEl = document.querySelector(".blood-row");
if (bloodRowEl) {
  bloodRowEl.addEventListener("click", function (e) {
    const btn = e.target.closest(".blood-btn");
    if (!btn) return;
    for (let x = 0; x < bloodButtons.length; x++) {
      bloodButtons[x].classList.remove("active");
    }
    btn.classList.add("active");
    selectedBlood = btn.textContent.trim();
    applyFilters();
  });
}

range.addEventListener("input", function () {
  distanceValue.textContent = range.value;
  updateRangeTrack();
  applyFilters();
});

if (mapBtn) mapBtn.addEventListener("click", openMapForNearestVisible);

hospitalCards.addEventListener("click", function (e) {
  const reserve = e.target.closest(".reserve-btn");
  if (reserve) {
    openEmergencyPageWithPrefill(
      {
        hospital: decodeURIComponent(reserve.dataset.hospital || ""),
        blood: reserve.dataset.blood || "",
        units: Number(reserve.dataset.units || 1),
      },
      "Urgent"
    );
    return;
  }
  const emerg = e.target.closest(".emergency-btn");
  if (emerg) {
    openEmergencyPageWithPrefill(
      {
        hospital: decodeURIComponent(emerg.dataset.hospital || ""),
        blood: emerg.dataset.blood || "",
        units: Number(emerg.dataset.units || 1),
      },
      "Critical"
    );
  }
});

updateRangeTrack();
applyFilters();
