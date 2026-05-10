const sideBtns = document.querySelectorAll(".sideBtn");
const views = document.querySelectorAll(".contentView");
const emergencyFeedList = document.getElementById("emergencyFeedList");
const inventoryTableBody = document.getElementById("inventoryTableBody");
const donorsTableBody = document.getElementById("donorsTableBody");
const refreshRequestsBtn = document.getElementById("refreshRequestsBtn");
const newRequestBtn = document.getElementById("newRequestBtn");

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

for (let i = 0; i < sideBtns.length; i++) {
  sideBtns[i].addEventListener("click", function () {
    const target = this.getAttribute("data-view");
    if (!target) return;
    for (let j = 0; j < sideBtns.length; j++) {
      sideBtns[j].classList.remove("isActive");
    }
    this.classList.add("isActive");
    for (let k = 0; k < views.length; k++) {
      views[k].classList.remove("activeView");
    }
    const view = document.querySelector(".contentView." + target);
    if (view) view.classList.add("activeView");
  });
}

document.body.addEventListener("click", function (e) {
  const t = e.target;

  if (t.closest("#clearEmergencyFeedBtn")) {
    e.preventDefault();
    if (emergencyFeedList) {
      emergencyFeedList.innerHTML =
        '<p style="padding:1rem;color:var(--text-muted);">No active emergency alerts.</p>';
    }
    return;
  }

  if (t.closest("#addUnitBatchBtn")) {
    e.preventDefault();
    if (!inventoryTableBody) return;
    const bloodType = (prompt("Blood type (e.g. A+, O-):", "AB+") || "").trim();
    if (!bloodType) return;
    const units = parseInt(prompt("Units to add:", "10"), 10);
    if (!Number.isFinite(units) || units < 1) {
      alert("Enter a positive number of units.");
      return;
    }
    const minTarget = parseInt(prompt("Minimum target (optional):", "40"), 10);
    const batchTarget = Number.isFinite(minTarget) && minTarget > 0 ? minTarget : 40;
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td><span class=\"blood-badge\">" +
      escapeHtml(bloodType) +
      "</span></td><td>" +
      units +
      "</td><td>" +
      batchTarget +
      "</td><td>" +
      new Date().toLocaleString() +
      "</td><td><span class=\"status-badge verified\"><span class=\"status-dot\"></span>Healthy</span></td>";
    inventoryTableBody.appendChild(tr);
    return;
  }

  if (t.closest("#addDonorBtn")) {
    e.preventDefault();
    if (!donorsTableBody) return;
    const name = (prompt("Donor name:", "") || "").trim();
    if (!name) return;
    const blood = (prompt("Blood type:", "O+") || "").trim() || "O+";
    const phone = (prompt("Phone:", "") || "").trim() || "—";
    const city = (prompt("City:", "") || "").trim() || "—";
    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" +
      escapeHtml(name) +
      "</td><td><span class=\"blood-badge\">" +
      escapeHtml(blood) +
      "</span></td><td>" +
      escapeHtml(phone) +
      "</td><td>" +
      escapeHtml(city) +
      "</td><td>" +
      new Date().toLocaleDateString() +
      '</td><td><span class="status-badge verified"><span class="status-dot"></span>Registered</span></td><td><button type="button" class="tableAction donorEditBtn">Edit</button></td>';
    donorsTableBody.appendChild(row);
    return;
  }

  const editBtn = t.closest(".donorEditBtn");
  if (editBtn) {
    e.preventDefault();
    const tr = editBtn.closest("tr");
    if (!tr || tr.children.length < 7) return;
    const nameCell = tr.children[0];
    const bloodText = tr.children[1].textContent.trim();
    const phoneCell = tr.children[2];
    const cityCell = tr.children[3];
    const newName = prompt("Donor name:", nameCell.textContent.trim());
    if (newName === null) return;
    const newBlood = prompt("Blood type:", bloodText);
    if (newBlood === null) return;
    const newPhone = prompt("Phone:", phoneCell.textContent.trim());
    if (newPhone === null) return;
    const newCity = prompt("City:", cityCell.textContent.trim());
    if (newCity === null) return;
    nameCell.textContent = newName.trim() || nameCell.textContent;
    tr.children[1].innerHTML =
      "<span class=\"blood-badge\">" +
      escapeHtml((newBlood || bloodText).trim() || bloodText) +
      "</span>";
    phoneCell.textContent = (newPhone || "").trim() || phoneCell.textContent;
    cityCell.textContent = (newCity || "").trim() || cityCell.textContent;
    return;
  }

  const feedItem = t.closest("#emergencyFeedList .feedItem");
  if (feedItem) {
    if (t.closest(".feedDetailsBtn")) {
      e.preventDefault();
      const t1 = feedItem.querySelector("h4");
      const t2 = feedItem.querySelector("p");
      let msg = "";
      if (t1) msg += t1.textContent;
      if (t2) msg += (msg ? "\n" : "") + t2.textContent;
      alert(msg);
      return;
    }
    if (t.closest(".feedDispatchBtn")) {
      e.preventDefault();
      const dbtn = t.closest(".feedDispatchBtn");
      dbtn.disabled = true;
      dbtn.textContent = "Dispatched";
      return;
    }
  }

  const reqCard = t.closest("#requestQueueList .requestCard");
  if (reqCard) {
    const statusEl = reqCard.querySelector(".request-status");
    if (t.closest(".requestDetailsBtn")) {
      e.preventDefault();
      const h4 = reqCard.querySelector("h4");
      const p = reqCard.querySelector("p");
      let m = "";
      if (h4) m += h4.textContent;
      if (p) m += (m ? "\n" : "") + p.textContent;
      alert(m);
      return;
    }
    if (t.closest(".requestDispatchBtn") && statusEl) {
      e.preventDefault();
      statusEl.textContent = "dispatched";
      return;
    }
    if (t.closest(".requestResolveBtn") && statusEl) {
      e.preventDefault();
      statusEl.textContent = "completed";
      return;
    }
  }
});

if (refreshRequestsBtn) {
  refreshRequestsBtn.addEventListener("click", function () {});
}

if (newRequestBtn) {
  newRequestBtn.addEventListener("click", function () {
    window.location.href = "../Emergancy/emergancy.html";
  });
}
