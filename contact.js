document.getElementById("contactForm").addEventListener("submit", function (event) {
  event.preventDefault();
  const name = document.getElementById("contactName").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const message = document.getElementById("contactMessage").value.trim();
  const status = document.getElementById("contactStatus");

  const subject = encodeURIComponent("Vital Stream contact: " + name);
  const body = encodeURIComponent(
    "From: " + name + " <" + email + ">\n\n" + message
  );
  const mailto = "mailto:support@vitalstream.local?subject=" + subject + "&body=" + body;

  status.textContent = "Opening your email app…";
  window.location.href = mailto;
});
