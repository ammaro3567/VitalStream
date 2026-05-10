const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const formError = document.getElementById("formError");
const loginBtn = document.getElementById("loginBtn");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", function () {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePassword.textContent = "🙈";
  } else {
    passwordInput.type = "password";
    togglePassword.textContent = "👁";
  }
});

function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

function isValidPassword(password) {
  return password.length >= 6;
}

function showError(element, message) {
  element.textContent = message;
  element.style.display = "block";
}

function clearError(element) {
  element.textContent = "";
  element.style.display = "none";
}

function validateForm() {
  let isValid = true;
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  clearError(emailError);
  clearError(passwordError);
  clearError(formError);

  if (email === "") {
    showError(emailError, "Email is required");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showError(emailError, "Please enter a valid email address");
    isValid = false;
  }

  if (password === "") {
    showError(passwordError, "Password is required");
    isValid = false;
  } else if (!isValidPassword(password)) {
    showError(passwordError, "Password must be at least 6 characters");
    isValid = false;
  }

  return isValid;
}

function loginUser() {
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";
  clearError(formError);

  setTimeout(() => {
    window.location.href = "../Admin/admin.html";
  }, 400);
}

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (validateForm()) loginUser();
});

emailInput.addEventListener("input", function () {
  clearError(emailError);
  clearError(formError);
});

passwordInput.addEventListener("input", function () {
  clearError(passwordError);
  clearError(formError);
});
