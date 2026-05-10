const SUPABASE_URL = "https://ofjtwbiorpylsegipgzo.supabase.co";
const SUPABASE_ANON_KEY =
   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manR3YmlvcnB5bHNlZ2lwZ3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDk3NjMsImV4cCI6MjA5MDcyNTc2M30.c0u43yD2vJdYdk7oeqJDZXWUgzDOI-TIrAHd1HTRM10";

const supabaseClient =
   typeof supabase !== "undefined" ?
   supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
         persistSession: false,
         autoRefreshToken: false,
         detectSessionInUrl: false,
      },
   }) :
   null;

const els = {
   sideButtons: document.querySelectorAll(".sideBtn"),
   contentViews: document.querySelectorAll(".contentView"),
   newRequestBtn: document.getElementById("newRequestBtn"),
   notificationCount: document.getElementById("notificationCount"),
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
   unseenNotificationTotal: 0,
   activeView: "dashboardView"
};

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
      year: "numeric"
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
      minute: "2-digit"
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
   if (urgency.includes("critical")) return {
      className: "critical",
      label: "CRITICAL"
   };
   if (urgency.includes("urgent")) return {
      className: "high",
      label: "HIGH PRIORITY"
   };
   return {
      className: "routine",
      label: "ROUTINE"
   };
}

function updateNotificationBadge() {
   const el = document.getElementById("notificationCount") || els.notificationCount;
   if (el) el.textContent = String(state.unseenNotificationTotal);
}

function bumpUnseenEmergencyNotification() {
   state.unseenNotificationTotal += 1;
   updateNotificationBadge();
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
   if (p.className === "critical") actions = `<div class="requestActions"><button class="feedBtn secondary requestDetailsBtn" data-id="${id}">Details</button><button class="feedBtn danger requestDispatchBtn" data-id="${id}">Dispatch</button></div>`;
   if (p.className === "high") actions = `<div class="requestActions"><button class="feedBtn secondary requestDetailsBtn" data-id="${id}">View Request</button></div>`;
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
   els.dashboardDonorBody.innerHTML = rows.map((row) => {
      const donorName = getField(row, ["name", "full_name"]) || "Unknown donor";
      return `<tr><td><div class="donor-info"><span>${donorName}</span></div></td><td><span class="blood-badge">${row.blood_type || "-"}</span></td><td>${formatDate(row.created_at)}</td><td><span class="status-badge verified"><span class="status-dot"></span>Registered</span></td><td><button class="tableAction">Open</button></td></tr>`;
   }).join("");
}

function renderInventoryTable(rows) {
   if (!els.inventoryTableBody) return;
   if (!rows.length) {
      els.inventoryTableBody.innerHTML = '<tr><td colspan="6">No inventory data found.</td></tr>';
      return;
   }
   els.inventoryTableBody.innerHTML = rows.map((row) => {
      const units = getInventoryUnits(row);
      const target = toNumber(getField(row, ["minimum_target", "min_target", "target_units"])) || 40;
      const low = units < target;
      return `<tr><td><span class="blood-badge">${getField(row, ["blood_type", "type", "blood_group"]) || "-"}</span></td><td>${units}</td><td>${target}</td><td>${formatDateTime(getField(row, ["updated_at", "created_at"]))}</td><td><span class="status-badge ${low ? "pending" : "verified"}"><span class="status-dot"></span>${low ? "Low Stock" : "Healthy"}</span></td><td><button class="tableAction inventoryUpdateBtn" data-id="${row.id || ""}" data-units="${units}">Update</button></td></tr>`;
   }).join("");
}

function renderDonorsTable(rows) {
   if (!els.donorsTableBody) return;
   if (!rows.length) {
      els.donorsTableBody.innerHTML = '<tr><td colspan="7">No donors found.</td></tr>';
      return;
   }
   els.donorsTableBody.innerHTML = rows.map((row) => {
      const donorName = getField(row, ["name", "full_name"]) || "Unknown";
      const location = getField(row, ["location", "city"]) || "-";
      return `<tr><td>${donorName}</td><td><span class="blood-badge">${row.blood_type || "-"}</span></td><td>${row.phone || "-"}</td><td>${location}</td><td>${formatDate(row.created_at)}</td><td><span class="status-badge verified"><span class="status-dot"></span>Registered</span></td><td><button class="tableAction donorEditBtn" data-id="${row.id || ""}" data-name="${donorName}" data-phone="${row.phone || ""}" data-location="${location}">Edit</button></td></tr>`;
   }).join("");
}

function renderRequestQueue(rows) {
   if (!els.requestQueueList) return;
   if (!rows.length) {
      els.requestQueueList.innerHTML = '<div class="requestCard routine"><h4>No requests in queue</h4><p>New emergency requests will appear here.</p></div>';
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

async function loadDashboardCounts() {
   if (!supabaseClient) return;
   let donors = 0;
   let units = 0;
   let pending = 0;
   const donorsRes = await supabaseClient.from("donors").select("*", {
      count: "exact",
      head: true
   });
   if (!donorsRes.error) donors = donorsRes.count || 0;
   const inventoryRes = await supabaseClient.from("inventory_units").select("*");
   if (!inventoryRes.error && Array.isArray(inventoryRes.data)) inventoryRes.data.forEach((row) => {
      units += getInventoryUnits(row);
   });
   const requestsRes = await supabaseClient.from("emergency_requests").select("status");
   if (!requestsRes.error && Array.isArray(requestsRes.data)) pending = requestsRes.data.filter((row) => ["pending", "new", "open"].includes(String(row.status || "").toLowerCase())).length;
   if (els.totalDonorsValue) els.totalDonorsValue.textContent = donors.toLocaleString();
   if (els.totalUnitsValue) els.totalUnitsValue.textContent = Math.round(units).toLocaleString();
   if (els.pendingRequestsValue) els.pendingRequestsValue.textContent = String(pending);
}

async function loadBloodStockLevels() {
   if (!supabaseClient) return;
   const res = await supabaseClient.from("inventory_units").select("*");
   if (res.error || !Array.isArray(res.data) || !res.data.length) return;
   const sums = {
      A: 0,
      B: 0,
      O: 0,
      AB: 0
   };
   let has = false;
   res.data.forEach((row) => {
      const g = getBloodGroupKey(getField(row, ["blood_type", "type", "blood_group"]));
      if (!g) return;
      const u = getInventoryUnits(row);
      if (u > 0) {
         has = true;
         sums[g] += u;
      }
   });
   const p = {
      A: 85,
      B: 62,
      O: 24,
      AB: 45
   };
   if (has) {
      const max = Math.max(sums.A, sums.B, sums.O, sums.AB, 1);
      p.A = Math.round((sums.A / max) * 100);
      p.B = Math.round((sums.B / max) * 100);
      p.O = Math.round((sums.O / max) * 100);
      p.AB = Math.round((sums.AB / max) * 100);
   }
   renderStockPercents(p);
}

async function loadRecentDonors() {
   if (!supabaseClient) return;
   const res = await supabaseClient.from("donors").select("name,blood_type,created_at").order("created_at", {
      ascending: false
   }).limit(6);
   if (!res.error) renderDashboardDonorsTable(res.data || []);
}

async function loadEmergencyFeed() {
   if (!supabaseClient || !els.emergencyFeedList) return;
   const res = await supabaseClient.from("emergency_requests").select("id,hospital_name,blood_type,urgency_level,status,created_at").order("created_at", {
      ascending: false
   }).limit(8);
   if (res.error) return;
   const rows = res.data || [];
   if (!rows.length) {
      els.emergencyFeedList.innerHTML = '<div class="feedItem routine"><h4>No emergency requests yet</h4><p>New requests will appear here in real-time.</p></div>';
      return;
   }
   els.emergencyFeedList.innerHTML = rows.map((row) => buildEmergencyFeedItemHtml(row)).join("");
}

async function loadInventorySection() {
   if (!supabaseClient) return;
   const res = await supabaseClient.from("inventory_units").select("*").order("updated_at", {
      ascending: false,
      nullsFirst: false
   });
   if (res.error) return;
   const rows = res.data || [];
   updateInventoryStats(rows);
   renderInventoryTable(rows);
}

async function loadDonorsSection() {
   if (!supabaseClient) return;
   const res = await supabaseClient.from("donors").select("id,name,blood_type,phone,location,created_at,latitude,longitude").order("created_at", {
      ascending: false
   }).limit(100);
   if (!res.error) renderDonorsTable(res.data || []);
}

async function loadRequestsQueue() {
   if (!supabaseClient) return;
   const res = await supabaseClient.from("emergency_requests").select("id,hospital_name,blood_type,urgency_level,status,created_at").order("created_at", {
      ascending: false
   }).limit(30);
   if (!res.error) renderRequestQueue(res.data || []);
}

async function loadDashboardSection() {
   await loadDashboardCounts();
   await loadBloodStockLevels();
   await loadRecentDonors();
   await loadEmergencyFeed();
}

function appendEmergencyFeedItem(item) {
   if (!els.emergencyFeedList) return;
   els.emergencyFeedList.insertAdjacentHTML("afterbegin", buildEmergencyFeedItemHtml(item));
   const items = els.emergencyFeedList.querySelectorAll(".feedItem");
   if (items.length > 8) items[items.length - 1].remove();
}

async function addUnitBatch() {
   const bloodType = prompt("Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-):");
   if (!bloodType) return;
   const units = toNumber(prompt("Available units for this batch:"));
   if (units <= 0) return alert("Please enter a valid units number.");
   const hospitalName = prompt("Location / Hospital name (optional):", "Admin Warehouse") || "Admin Warehouse";
   const distanceKm = toNumber(prompt("Distance km (optional):", "0"));
   const payload = {
      blood_type: bloodType.trim().toUpperCase(),
      units,
      location: hospitalName.trim(),
      distance_km: distanceKm
   };
   const {
      error
   } = await supabaseClient.from("inventory_units").insert([payload]);
   if (error) return alert(`Failed to add unit batch: ${error.message || "Unknown error"}`);
   await loadInventorySection();
   await loadDashboardCounts();
   await loadBloodStockLevels();
}

async function updateInventoryRow(id, units) {
   if (!id) return alert("Row ID is missing.");
   const next = prompt("Update available units:", String(units || 0));
   if (next === null) return;
   const value = toNumber(next);
   if (value < 0) return alert("Units must be zero or more.");
   const {
      error
   } = await supabaseClient.from("inventory_units").update({
      units: value
   }).eq("id", id);
   if (error) return alert(`Failed to update inventory: ${error.message || "Unknown error"}`);
   await loadInventorySection();
   await loadDashboardCounts();
   await loadBloodStockLevels();
}

async function addDonor() {
   const fullName = prompt("Donor full name:");
   if (!fullName) return;
   const bloodType = prompt("Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-):");
   if (!bloodType) return;
   const payload = {
      name: fullName.trim(),
      blood_type: bloodType.trim().toUpperCase(),
      phone: (prompt("Phone (optional):", "") || "").trim() || null,
      location: (prompt("Location / City (optional):", "") || "").trim() || null,
   };
   const {
      error
   } = await supabaseClient.from("donors").insert([payload]);
   if (error) return alert(`Failed to add donor: ${error.message || "Unknown error"}`);
   await loadDonorsSection();
   await loadRecentDonors();
   await loadDashboardCounts();
}

async function editDonor(id, currentName, currentPhone, currentLocation) {
   if (!id) return alert("Donor ID is missing.");
   const nextName = prompt("Update donor name:", currentName || "");
   if (nextName === null) return;
   const nextPhone = prompt("Update donor phone:", currentPhone || "");
   if (nextPhone === null) return;
   const nextLocation = prompt("Update donor location:", currentLocation || "");
   if (nextLocation === null) return;

   const {
      error
   } = await supabaseClient
      .from("donors")
      .update({
         name: nextName.trim() || currentName || null,
         phone: nextPhone.trim() || null,
         location: nextLocation.trim() || null,
      })
      .eq("id", id);

   if (error) return alert(`Failed to update donor: ${error.message || "Unknown error"}`);
   await loadDonorsSection();
   await loadRecentDonors();
}

async function updateRequestStatus(id, statusValue) {
   if (!id) return alert("Request ID is missing.");
   const {
      error
   } = await supabaseClient.from("emergency_requests").update({
      status: statusValue
   }).eq("id", id);
   if (error) return alert(`Failed to update request: ${error.message || "Unknown error"}`);
   await loadRequestsQueue();
   await loadDashboardCounts();
   await loadEmergencyFeed();
}

async function showRequestDetails(id) {
   if (!id) return;
   const {
      data,
      error
   } = await supabaseClient.from("emergency_requests").select("*").eq("id", id).maybeSingle();
   if (error || !data) return alert("Failed to load request details.");
   alert(`Request Details\n\nID: ${data.id || "-"}\nHospital: ${data.hospital_name || "-"}\nBlood Type: ${data.blood_type || "-"}\nUrgency: ${data.urgency_level || "-"}\nStatus: ${data.status || "-"}\nCreated: ${formatDateTime(data.created_at)}`);
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
         if (target === "inventoryView") await loadInventorySection();
         if (target === "donorsView") await loadDonorsSection();
         if (target === "requestsView") await loadRequestsQueue();
      });
   });
}

function setupButtons() {
   if (els.newRequestBtn) els.newRequestBtn.addEventListener("click", () => {
      window.location.href = "../Emergancy/emergancy.html";
   });
   if (els.clearFeedBtn) els.clearFeedBtn.addEventListener("click", () => {
      state.unseenNotificationTotal = 0;
      updateNotificationBadge();
      if (els.emergencyFeedList) {
         els.emergencyFeedList.innerHTML = '<div class="feedItem routine"><h4>Feed cleared</h4><p>New emergency requests will appear here.</p></div>';
      }
   });
   if (els.refreshRequestsBtn) els.refreshRequestsBtn.addEventListener("click", () => {
      loadRequestsQueue();
   });
   if (els.addUnitBatchBtn) els.addUnitBatchBtn.addEventListener("click", () => {
      addUnitBatch();
   });
   if (els.addDonorBtn) els.addDonorBtn.addEventListener("click", () => {
      addDonor();
   });
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

function setupRealtimeListeners() {
   supabaseClient
      .channel("admin-dashboard-realtime")
      .on("postgres_changes", {
         event: "*",
         schema: "public",
         table: "emergency_requests",
      }, (payload) => {
         const ev = String(payload.eventType || payload.event_type || "").toUpperCase();
         if (ev === "INSERT") {
            bumpUnseenEmergencyNotification();
            appendEmergencyFeedItem(payload.new || {});
            if (els.pendingRequestsValue) {
               els.pendingRequestsValue.textContent = String(
                  toNumber(els.pendingRequestsValue.textContent) + 1
               );
            }
         }
         if (state.activeView === "requestsView") loadRequestsQueue();
      })
      .on("postgres_changes", {
         event: "*",
         schema: "public",
         table: "donors"
      }, () => {
         loadDashboardCounts();
         loadRecentDonors();
         if (state.activeView === "donorsView") loadDonorsSection();
      })
      .on("postgres_changes", {
         event: "*",
         schema: "public",
         table: "inventory_units"
      }, () => {
         loadDashboardCounts();
         loadBloodStockLevels();
         if (state.activeView === "inventoryView") loadInventorySection();
      })
      .subscribe();
}

async function initAdminPage() {
   if (!supabaseClient) {
      console.error("Supabase is not loaded on admin page.");
      return;
   }
   setupViewSwitching();
   setupButtons();
   setupEventDelegation();
   updateNotificationBadge();
   await loadDashboardSection();
   await loadInventorySection();
   await loadDonorsSection();
   await loadRequestsQueue();
   setupRealtimeListeners();
}

initAdminPage();