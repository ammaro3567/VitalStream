const SUPABASE_URL = "https://ofjtwbiorpylsegipgzo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manR3YmlvcnB5bHNlZ2lwZ3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDk3NjMsImV4cCI6MjA5MDcyNTc2M30.c0u43yD2vJdYdk7oeqJDZXWUgzDOI-TIrAHd1HTRM10";

const supabaseClient =
  typeof supabase !== "undefined"
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const dobInput = document.getElementById("dob");
const phoneInput = document.getElementById("phone");
const cityInput = document.getElementById("city");
const getLocationBtn = document.getElementById("getLocationBtn");
const locationText = document.getElementById("locationText");
const registerBtn = document.getElementById("registerBtn");
const donorLoginBtn = document.getElementById("donorLoginBtn");
const statusMessage = document.getElementById("statusMessage");
const bloodButtons = document.querySelectorAll(".blood-btn");

let selectedBlood = "";
let userCoords = null;

function showMessage(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.classList.remove("error", "success");
  if (type) statusMessage.classList.add(type);
}

function getLocation() {
  if (!navigator.geolocation) {
    showMessage("Geolocation is not supported in this browser.", "error");
    return;
  }

  getLocationBtn.disabled = true;
  getLocationBtn.textContent = "Getting...";
  showMessage("Getting your location...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      localStorage.setItem(
        "vital_stream_user_location",
        JSON.stringify({
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          savedAt: new Date().toISOString(),
        })
      );

      locationText.textContent = `${userCoords.latitude.toFixed(5)}, ${userCoords.longitude.toFixed(5)}`;
      showMessage("Location captured successfully.", "success");
      getLocationBtn.disabled = false;
      getLocationBtn.textContent = "Get My Location";
    },
    () => {
      showMessage("Could not get location. Please allow location permission.", "error");
      getLocationBtn.disabled = false;
      getLocationBtn.textContent = "Get My Location";
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function validateForm() {
  if (!fullNameInput.value.trim()) {
    showMessage("Please enter full name.", "error");
    return false;
  }
  if (!selectedBlood) {
    showMessage("Please select blood type.", "error");
    return false;
  }
  return true;
}

async function registerDonor() {
  if (!validateForm()) return;

  if (!supabaseClient) {
    showMessage("Supabase is not loaded.", "error");
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "REGISTERING...";
  showMessage("Submitting donor data...");

  try {
    const payload = {
      name: fullNameInput.value.trim(),
      phone: phoneInput.value.trim() || null,
      blood_type: selectedBlood,
      location: cityInput.value.trim() || null,
      latitude: userCoords ? userCoords.latitude : null,
      longitude: userCoords ? userCoords.longitude : null,
    };

    const { error } = await supabaseClient.from("donors").insert([payload]);
    if (error) throw error;

    showMessage("Registered successfully. Thank you for donating!", "success");
    fullNameInput.value = "";
    emailInput.value = "";
    dobInput.value = "";
    phoneInput.value = "";
    cityInput.value = "";
    bloodButtons.forEach((btn) => btn.classList.remove("active"));
    selectedBlood = "";
  } catch (error) {
    showMessage(`Registration failed: ${error.message || "Unknown error"}`, "error");
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "REGISTER AS DONOR →";
  }
}

bloodButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    bloodButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedBlood = btn.textContent.trim();
  });
});

getLocationBtn.addEventListener("click", getLocation);
registerBtn.addEventListener("click", registerDonor);
if (donorLoginBtn) {
  donorLoginBtn.addEventListener("click", () => {
    window.location.href = "../../login/login.html";
  });
}
