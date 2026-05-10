const els = {
  sideButtons: document.querySelectorAll(".sideBtn"),
  contentViews: document.querySelectorAll(".contentView"),
  newRequestBtn: document.getElementById("newRequestBtn"),
  clearFeedBtn: document.querySelector(".feedHeader button"),
  totalDonorsValue: document.getElementById("totalDonorsValue"),
  totalUnitsValue: document.getElementById("totalUnitsValue"),
  pendingRequestsValue: document.getElementById("pendingRequestsValue"),
  progressBars: document.querySelectorAll(".progress-bar[data-blood-type]"),
  percentageValues: document.querySelectorAll(".percentage[data-blood-type]"),
  stockStatusValues: document.querySelectorAll(".status[data-blood-type]"),
  dashboardDonorBody: document.getElementById("dashboardDonorBody"),
  emergencyFeedList: document.getElementById("emergencyFeedList"),
  addUnitBatchBtn: document.getElementById("addUnitBatchBtn"),
  inventoryTableBody: document.getElementById("inventoryTableBody"),
  inventoryTotalUnits: document.getElementById("inventoryTotalUnits"),
  inventoryCriticalTypes: document.getElementById("inventoryCriticalTypes"),
  inventoryExpiringSoon: document.getElementById("inventoryExpiringSoon"),
  addDonorBtn: document.getElementById("addDonorBtn"),
  donorsTableBody: document.getElementById("donorsTableBody"),
  refreshRequestsBtn: document.getElementById("refreshRequestsBtn"),
  requestQueueList: document.getElementById("requestQueueList"),
};

const state = {
  activeView: "dashboardView",
};

function getDb() {
  return VitalStreamDemo.load();
}

function commitDb(db) {
  VitalStreamDemo.save(db);
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getField(row, keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return null;
}

function getInventoryUnits(row) {
  return toNumber(getField(row, ["available_units", "units_available", "units", "quantity", "amount", "liters"]));
}

function getBloodGroupKey(rawType) {
  const type = String(rawType || "").trim().toUpperCase();
  if (type.startsWith("AB")) return "AB";
  if (type.startsWith("A")) return "A";
  if (type.startsWith("B")) return "B";
  if (type.startsWith("O")) return "O";
  return "";
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return "now";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "now";
  const diffMin = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

function getStatusLabelFromPercent(percent) {
  if (percent < 30) return "(Low Stock)";
  if (percent < 70) return "(Moderate)";
  return "(Safe)";
}

function getRequestPriority(urgencyLevel) {
  const urgency = String(urgencyLevel || "").toLowerCase();
  if (urgency.includes("critical")) return { className: "critical", label: "CRITICAL" };
  if (urgency.includes("urgent")) return { className: "high", label: "HIGH PRIORITY" };
  return { className: "routine", label: "ROUTINE" };
}

function sortByCreatedDesc(arr) {
  return [...arr].sort((a, b) => {
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return tb - ta;
  });
}

function renderStockPercents(map) {
  els.progressBars.forEach((bar) => {
    const key = bar.dataset.bloodType;
    bar.style.width = `${Math.max(0, Math.min(100, Math.round(map[key] || 0)))}%`;
  });
  els.percentageValues.forEach((item) => {
    const key = item.dataset.bloodType;
    const value = Math.max(0, Math.min(100, Math.round(map[key] || 0)));
    item.textContent = `${value}%`;
  });
  els.stockStatusValues.forEach((item) => {
    const key = item.dataset.bloodType;
    const value = Math.max(0, Math.min(100, Math.round(map[key] || 0)));
    item.textContent = getStatusLabelFromPercent(value);
    item.classList.remove("safe", "moderate", "low");
    if (value < 30) item.classList.add("low");
    else if (value < 70) item.classList.add("moderate");
    else item.classList.add("safe");
  });
}

function buildEmergencyFeedItemHtml(item) {
  const p = getRequestPriority(item.urgency_level);
  const id = item.id || "";
  const blood = item.blood_type ? String(item.blood_type).toUpperCase() : "Blood";
  const title = `${blood} Needed`;
  const hospital = item.hospital_name || "Hospital not provided";
  let actions = "";
  if (p.className === "critical")
    actions = `<div class="requestActions"><button class="feedBtn secondary requestDetailsBtn" data-id="${id}">Details</button><button class="feedBtn danger requestDispatchBtn" data-id="${id}">Dispatch</button></div>`;
  if (p.className === "high")
    actions = `<div class="requestActions"><button class="feedBtn secondary requestDetailsBtn" data-id="${id}">View Request</button></div>`;
  return `<div class="feedItem ${p.className}"><div class="feedTop"><span class="priorityTag">${p.label}</span><span class="feedTime">${formatRelativeTime(item.created_at)}</span></div><h4>${title}</h4><p>${hospital}</p>${actions}</div>`;
}

function buildRequestQueueItemHtml(item) {
  const p = getRequestPriority(item.urgency_level);
  const id = item.id || "";
  const blood = item.blood_type ? String(item.blood_type).toUpperCase() : "Blood";
  return `<div class="requestCard ${p.className}"><div class="requestTop"><span class="priorityTag">${p.label}</span><span class="feedTime">${formatRelativeTime(item.created_at)}</span></div><h4>${blood} Request</h4><p>${item.hospital_name || "Hospital not provided"} • Status: ${item.status || "pending"}</p><div class="requestActions"><button class="feedBtn secondary requestDetailsBtn" data-id="${id}">Details</button><button class="feedBtn danger requestDispatchBtn" data-id="${id}">Dispatch</button><button class="feedBtn secondary requestResolveBtn" data-id="${id}">Resolve</button></div></div>`;
}

function renderDashboardDonorsTable(rows) {
  if (!els.dashboardDonorBody) return;
  if (!rows.length) {
    els.dashboardDonorBody.innerHTML = '<tr><td colspan="5">No donors found yet.</td></tr>';
    return;
  }
  els.dashboardDonorBody.innerHTML = rows
    .map((row) => {
      const donorName = getField(row, ["name", "full_name"]) || "Unknown donor";
      return `<tr><td><div class="donor-info"><span>${donorName}</span></div></td><td><span class="blood-badge">${row.blood_type || "-"}</span></td><td>${formatDate(row.created_at)}</td><td><span class="status-badge verified"><span class="status-dot"></span>Registered</span></td><td><button class="tableAction">Open</button></td></tr>`;
    })
    .join("");
}

function renderInventoryTable(rows) {
  if (!els.inventoryTableBody) return;
  if (!rows.length) {
    els.inventoryTableBody.innerHTML = '<tr><td colspan="6">No inventory data found.</td></tr>';
    return;
  }
  els.inventoryTableBody.innerHTML = rows
    .map((row) => {
      const units = getInventoryUnits(row);
      const target = toNumber(getField(row, ["minimum_target", "min_target", "target_units"])) || 40;
      const low = units < target;
      return `<tr><td><span class="blood-badge">${getField(row, ["blood_type", "type", "blood_group"]) || "-"}</span></td><td>${units}</td><td>${target}</td><td>${formatDateTime(getField(row, ["updated_at", "created_at"]))}</td><td><span class="status-badge ${low ? "pending" : "verified"}"><span class="status-dot"></span>${low ? "Low Stock" : "Healthy"}</span></td><td><button class="tableAction inventoryUpdateBtn" data-id="${row.id || ""}" data-units="${units}">Update</button></td></tr>`;
    })
    .join("");
}

function renderDonorsTable(rows) {
  if (!els.donorsTableBody) return;
  if (!rows.length) {
    els.donorsTableBody.innerHTML = '<tr><td colspan="7">No donors found.</td></tr>';
    return;
  }
  els.donorsTableBody.innerHTML = rows
    .map((row) => {
      const donorName = getField(row, ["name", "full_name"]) || "Unknown";
      const location = getField(row, ["location", "city"]) || "-";
      return `<tr><td>${donorName}</td><td><span class="blood-badge">${row.blood_type || "-"}</span></td><td>${row.phone || "-"}</td><td>${location}</td><td>${formatDate(row.created_at)}</td><td><span class="status-badge verified"><span class="status-dot"></span>Registered</span></td><td><button class="tableAction donorEditBtn" data-id="${row.id || ""}" data-name="${donorName}" data-phone="${row.phone || ""}" data-location="${location}">Edit</button></td></tr>`;
    })
    .join("");
}

function renderRequestQueue(rows) {
  if (!els.requestQueueList) return;
  if (!rows.length) {
    els.requestQueueList.innerHTML =
      '<div class="requestCard routine"><h4>No requests in queue</h4><p>New emergency requests will appear here.</p></div>';
    return;
  }
  els.requestQueueList.innerHTML = rows.map((row) => buildRequestQueueItemHtml(row)).join("");
}

function updateInventoryStats(rows) {
  let total = 0;
  let critical = 0;
  let expiring = 0;
  rows.forEach((row) => {
    const units = getInventoryUnits(row);
    total += units;
    if (units > 0 && units < 30) critical += 1;
    const expiry = getField(row, ["expiry_date", "expires_at"]);
    if (expiry) {
      const days = Math.floor((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days >= 0 && days <= 7) expiring += 1;
    }
  });
  if (els.inventoryTotalUnits) els.inventoryTotalUnits.textContent = String(Math.round(total));
  if (els.inventoryCriticalTypes) els.inventoryCriticalTypes.textContent = String(critical);
  if (els.inventoryExpiringSoon) els.inventoryExpiringSoon.textContent = String(expiring);
}

function loadDashboardCounts() {
  const db = getDb();
  const donors = db.donors.length;
  let units = 0;
  db.inventory_units.forEach((row) => {
    units += getInventoryUnits(row);
  });
  const pending = db.emergency_requests.filter((row) =>
    ["pending", "new", "open"].includes(String(row.status || "").toLowerCase())
  ).length;
  if (els.totalDonorsValue) els.totalDonorsValue.textContent = donors.toLocaleString();
  if (els.totalUnitsValue) els.totalUnitsValue.textContent = Math.round(units).toLocaleString();
  if (els.pendingRequestsValue) els.pendingRequestsValue.textContent = String(pending);
}

function loadBloodStockLevels() {
  const db = getDb();
  const rows = db.inventory_units;
  if (!rows.length) return;
  const sums = { A: 0, B: 0, O: 0, AB: 0 };
  let has = false;
  rows.forEach((row) => {
    const g = getBloodGroupKey(getField(row, ["blood_type", "type", "blood_group"]));
    if (!g) return;
    const u = getInventoryUnits(row);
    if (u > 0) {
      has = true;
      sums[g] += u;
    }
  });
  const p = { A: 85, B: 62, O: 24, AB: 45 };
  if (has) {
    const max = Math.max(sums.A, sums.B, sums.O, sums.AB, 1);
    p.A = Math.round((sums.A / max) * 100);
    p.B = Math.round((sums.B / max) * 100);
    p.O = Math.round((sums.O / max) * 100);
    p.AB = Math.round((sums.AB / max) * 100);
  }
  renderStockPercents(p);
}

function loadRecentDonors() {
  const db = getDb();
  const rows = sortByCreatedDesc(db.donors).slice(0, 6);
  renderDashboardDonorsTable(rows);
}

function loadEmergencyFeed() {
  if (!els.emergencyFeedList) return;
  const db = getDb();
  const rows = sortByCreatedDesc(db.emergency_requests).slice(0, 8);
  if (!rows.length) {
    els.emergencyFeedList.innerHTML =
      '<div class="feedItem routine"><h4>No emergency requests yet</h4><p>Submit a request from the emergency page to see it here.</p></div>';
    return;
  }
  els.emergencyFeedList.innerHTML = rows.map((row) => buildEmergencyFeedItemHtml(row)).join("");
}

function loadInventorySection() {
  const db = getDb();
  const rows = [...db.inventory_units].sort((a, b) => {
    const ta = new Date(a.updated_at || 0).getTime();
    const tb = new Date(b.updated_at || 0).getTime();
    return tb - ta;
  });
  updateInventoryStats(rows);
  renderInventoryTable(rows);
}

function loadDonorsSection() {
  const db = getDb();
  const rows = sortByCreatedDesc(db.donors).slice(0, 100);
  renderDonorsTable(rows);
}

function loadRequestsQueue() {
  const db = getDb();
  const rows = sortByCreatedDesc(db.emergency_requests).slice(0, 30);
  renderRequestQueue(rows);
}

async function loadDashboardSection() {
  loadDashboardCounts();
  loadBloodStockLevels();
  loadRecentDonors();
  loadEmergencyFeed();
}

function appendEmergencyFeedItem(item) {
  if (!els.emergencyFeedList) return;
  const firstH4 = els.emergencyFeedList.querySelector("h4");
  if (firstH4) {
    const t = firstH4.textContent || "";
    if (t.includes("Feed cleared") || t.includes("No emergency requests yet")) {
      els.emergencyFeedList.innerHTML = "";
    }
  }
  els.emergencyFeedList.insertAdjacentHTML("afterbegin", buildEmergencyFeedItemHtml(item));
  const items = els.emergencyFeedList.querySelectorAll(".feedItem");
  if (items.length > 8) items[items.length - 1].remove();
}

function addUnitBatch() {
  const bloodType = prompt("Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-):");
  if (!bloodType) return;
  const units = toNumber(prompt("Available units for this batch:"));
  if (units <= 0) return alert("Please enter a valid units number.");
  const hospitalName = prompt("Location / Hospital name (optional):", "Admin Warehouse") || "Admin Warehouse";
  const distanceKm = toNumber(prompt("Distance km (optional):", "0"));
  const db = getDb();
  const id = VitalStreamDemo.nextId(db, "inventory_units");
  db.inventory_units.push({
    id,
    blood_type: bloodType.trim().toUpperCase(),
    units,
    status: "available",
    location: hospitalName.trim(),
    distance_km: distanceKm,
    updated_at: new Date().toISOString(),
  });
  commitDb(db);
  loadInventorySection();
  loadDashboardCounts();
  loadBloodStockLevels();
}

function updateInventoryRow(id, units) {
  if (!id) return alert("Row ID is missing.");
  const next = prompt("Update available units:", String(units || 0));
  if (next === null) return;
  const value = toNumber(next);
  if (value < 0) return alert("Units must be zero or more.");
  const db = getDb();
  const row = db.inventory_units.find((r) => String(r.id) === String(id));
  if (!row) return alert("Row not found.");
  row.units = value;
  row.updated_at = new Date().toISOString();
  commitDb(db);
  loadInventorySection();
  loadDashboardCounts();
  loadBloodStockLevels();
}

function addDonor() {
  const fullName = prompt("Donor full name:");
  if (!fullName) return;
  const bloodType = prompt("Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-):");
  if (!bloodType) return;
  const db = getDb();
  const id = VitalStreamDemo.nextId(db, "donors");
  db.donors.push({
    id,
    name: fullName.trim(),
    blood_type: bloodType.trim().toUpperCase(),
    phone: (prompt("Phone (optional):", "") || "").trim() || null,
    location: (prompt("Location / City (optional):", "") || "").trim() || null,
    created_at: new Date().toISOString(),
    latitude: null,
    longitude: null,
  });
  commitDb(db);
  loadDonorsSection();
  loadRecentDonors();
  loadDashboardCounts();
}

function editDonor(id, currentName, currentPhone, currentLocation) {
  if (!id) return alert("Donor ID is missing.");
  const nextName = prompt("Update donor name:", currentName || "");
  if (nextName === null) return;
  const nextPhone = prompt("Update donor phone:", currentPhone || "");
  if (nextPhone === null) return;
  const nextLocation = prompt("Update donor location:", currentLocation || "");
  if (nextLocation === null) return;
  const db = getDb();
  const row = db.donors.find((r) => String(r.id) === String(id));
  if (!row) return alert("Donor not found.");
  row.name = nextName.trim() || currentName;
  row.phone = nextPhone.trim() || null;
  row.location = nextLocation.trim() || null;
  commitDb(db);
  loadDonorsSection();
  loadRecentDonors();
}

function updateRequestStatus(id, statusValue) {
  if (!id) return alert("Request ID is missing.");
  const db = getDb();
  const row = db.emergency_requests.find((r) => String(r.id) === String(id));
  if (!row) return alert("Request not found.");
  row.status = statusValue;
  commitDb(db);
  loadRequestsQueue();
  loadDashboardCounts();
  loadEmergencyFeed();
}

function showRequestDetails(id) {
  if (!id) return;
  const db = getDb();
  const data = db.emergency_requests.find((r) => String(r.id) === String(id));
  if (!data) return alert("Failed to load request details.");
  alert(
    `Request Details\n\nID: ${data.id || "-"}\nHospital: ${data.hospital_name || "-"}\nBlood Type: ${data.blood_type || "-"}\nUrgency: ${data.urgency_level || "-"}\nStatus: ${data.status || "-"}\nCreated: ${formatDateTime(data.created_at)}`
  );
}

function setupViewSwitching() {
  els.sideButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const target = btn.dataset.view;
      if (!target) return;
      state.activeView = target;
      els.sideButtons.forEach((b) => b.classList.remove("isActive"));
      btn.classList.add("isActive");
      els.contentViews.forEach((view) => view.classList.toggle("activeView", view.classList.contains(target)));
      if (target === "dashboardView") await loadDashboardSection();
      if (target === "inventoryView") loadInventorySection();
      if (target === "donorsView") loadDonorsSection();
      if (target === "requestsView") loadRequestsQueue();
    });
  });
}

function setupButtons() {
  if (els.newRequestBtn)
    els.newRequestBtn.addEventListener("click", () => {
      window.location.href = "../Emergancy/emergancy.html";
    });
  if (els.clearFeedBtn)
    els.clearFeedBtn.addEventListener("click", () => {
      if (els.emergencyFeedList) {
        els.emergencyFeedList.innerHTML =
          '<div class="feedItem routine"><h4>Feed cleared</h4><p>New emergency requests will appear here.</p></div>';
      }
    });
  if (els.refreshRequestsBtn) els.refreshRequestsBtn.addEventListener("click", () => loadRequestsQueue());
  if (els.addUnitBatchBtn) els.addUnitBatchBtn.addEventListener("click", () => addUnitBatch());
  if (els.addDonorBtn) els.addDonorBtn.addEventListener("click", () => addDonor());
}

function setupEventDelegation() {
  if (els.inventoryTableBody) {
    els.inventoryTableBody.addEventListener("click", (event) => {
      const btn = event.target.closest(".inventoryUpdateBtn");
      if (btn) updateInventoryRow(btn.dataset.id, btn.dataset.units);
    });
  }
  if (els.donorsTableBody) {
    els.donorsTableBody.addEventListener("click", (event) => {
      const btn = event.target.closest(".donorEditBtn");
      if (btn) editDonor(btn.dataset.id, btn.dataset.name, btn.dataset.phone, btn.dataset.location);
    });
  }
  const requestHandler = (event) => {
    const details = event.target.closest(".requestDetailsBtn");
    if (details) return showRequestDetails(details.dataset.id);
    const dispatch = event.target.closest(".requestDispatchBtn");
    if (dispatch) return updateRequestStatus(dispatch.dataset.id, "dispatched");
    const resolve = event.target.closest(".requestResolveBtn");
    if (resolve) return updateRequestStatus(resolve.dataset.id, "completed");
  };
  if (els.emergencyFeedList) els.emergencyFeedList.addEventListener("click", requestHandler);
  if (els.requestQueueList) els.requestQueueList.addEventListener("click", requestHandler);
}

function initAdminPage() {
  if (typeof VitalStreamDemo === "undefined") {
    console.error("demo-store.js must load before admin.js");
    return;
  }
  setupViewSwitching();
  setupButtons();
  setupEventDelegation();
  loadDashboardSection();
  loadInventorySection();
  loadDonorsSection();
  loadRequestsQueue();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      loadDashboardSection();
      if (state.activeView === "inventoryView") loadInventorySection();
      if (state.activeView === "donorsView") loadDonorsSection();
      if (state.activeView === "requestsView") loadRequestsQueue();
    }
  });
}

initAdminPage();
