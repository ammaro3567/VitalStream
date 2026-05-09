// =============================================
// SUPABASE CONFIGURATION
// =============================================
// Replace these with your Supabase project credentials
const SUPABASE_URL = 'https://ofjtwbiorpylsegipgzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manR3YmlvcnB5bHNlZ2lwZ3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDk3NjMsImV4cCI6MjA5MDcyNTc2M30.c0u43yD2vJdYdk7oeqJDZXWUgzDOI-TIrAHd1HTRM10';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================
// DOM ELEMENTS
// =============================================
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const formError = document.getElementById('formError');
const loginBtn = document.getElementById('loginBtn');
const togglePassword = document.getElementById('togglePassword');

// =============================================
// TOGGLE PASSWORD VISIBILITY
// =============================================
togglePassword.addEventListener('click', function() {
    // Check current password type
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePassword.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        togglePassword.textContent = '👁';
    }
});

// =============================================
// VALIDATION FUNCTIONS
// =============================================

// Validate email format
function isValidEmail(email) {
    // Simple email regex pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Validate password (minimum 6 characters)
function isValidPassword(password) {
    return password.length >= 6;
}

// Show error message
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

// Clear error message
function clearError(element) {
    element.textContent = '';
    element.style.display = 'none';
}

// =============================================
// FORM VALIDATION
// =============================================
function validateForm() {
    let isValid = true;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Clear all errors first
    clearError(emailError);
    clearError(passwordError);
    clearError(formError);

    // Validate email
    if (email === '') {
        showError(emailError, 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError(emailError, 'Please enter a valid email address');
        isValid = false;
    }

    // Validate password
    if (password === '') {
        showError(passwordError, 'Password is required');
        isValid = false;
    } else if (!isValidPassword(password)) {
        showError(passwordError, 'Password must be at least 6 characters');
        isValid = false;
    }

    return isValid;
}

// =============================================
// LOGIN FUNCTION
// =============================================
async function loginUser(email, password) {
    try {
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        clearError(formError);

        // Call Supabase Auth API
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        // Check for errors
        if (error) {
            throw error;
        }

        // Success - redirect to admin dashboard
        console.log('Login successful:', data);
        window.location.href = '../Admin/admin.html';

    } catch (error) {
        // Handle different error types
        console.error('Login error:', error);

        let errorMessage = 'An error occurred. Please try again.';

        // Common Supabase auth errors
        if (error.message) {
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Please check your email and confirm your account.';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Too many attempts. Please wait and try again.';
            } else {
                errorMessage = error.message;
            }
        }

        showError(formError, errorMessage);

    } finally {
        // Reset button state
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In →';
    }
}

// =============================================
// FORM SUBMISSION
// =============================================
loginForm.addEventListener('submit', async function(event) {
    // Prevent page reload
    event.preventDefault();

    // Validate form first
    if (validateForm()) {
        // Get form values
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Call login function
        await loginUser(email, password);
    }
});

// =============================================
// REAL-TIME VALIDATION (optional - clears errors as user types)
// =============================================
emailInput.addEventListener('input', function() {
    clearError(emailError);
    clearError(formError);
});

passwordInput.addEventListener('input', function() {
    clearError(passwordError);
    clearError(formError);
});