document.getElementById("contactForm").addEventListener("submit", function (event) {
  event.preventDefault();
  const name = document.getElementById("contactName").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const message = document.getElementById("contactMessage").value.trim();
  const status = document.getElementById("contactStatus");

  if (!name || !email || !message) {
    status.textContent = "Please fill in all fields.";
    return;
  }

  status.textContent =
    "Thanks — your message is noted here only (demo; nothing is emailed or saved).";
  document.getElementById("contactForm").reset();
});
