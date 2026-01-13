/**
 * Authentication Module
 * Handles login, logout, and role-based access
 */

// ==================== LOGIN ====================
const loginForm = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");

if (loginForm) {
  loginForm.addEventListener("submit", handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Clear previous errors
  clearError();

  // Validate input
  if (!email || !password) {
    showError("Please enter both email and password");
    return;
  }

  try {
    const response = await fetch(SERVER_URL + "api/v1/auth/login", {
      method: "POST",
      credentials: "include", // Important: Send/receive HTTP-only cookies
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Backend has set HTTP-only cookies with the accessToken
      console.log("Login response data:", data);
      
      // Check if user is an admin (check both 'role' and 'Role' for case sensitivity)
      const userRole = data.role || data.Role;
      console.log("User role:", userRole);
      
      if (userRole !== "admin") {
        showError("Access denied. Admin privileges required.");
        // Log out the user
        await fetch(SERVER_URL + "api/v1/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        return;
      }
      // Redirect to dashboard for admin users
      window.location.href = "index.html";
    } else {
      showError(data.message || "Login failed. Please check your credentials.");
    }
  } catch (error) {
    console.error("Login error:", error);
    showError("Connection error. Please try again.");
  }
}

// ==================== SIGNUP ====================
const signupForm = document.getElementById("signup-form");

if (signupForm) {
  signupForm.addEventListener("submit", handleSignup);
}

async function handleSignup(e) {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Clear previous errors
  clearError();

  // Validate input
  if (!firstName || !lastName || !email || !password) {
    showError("Please fill in all required fields");
    return;
  }

  if (password !== confirmPassword) {
    showError("Passwords do not match");
    return;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters");
    return;
  }

  try {
    const response = await fetch(SERVER_URL + "api/v1/users", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: firstName,
        last_name: lastName,
        email,
        password,
        phone_number: phone,
        address,
        role: "user",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Account created successfully! Please sign in.");
      window.location.href = "login.html";
    } else {
      showError(data.message || "Failed to create account");
    }
  } catch (error) {
    console.error("Signup error:", error);
    showError("Connection error. Please try again.");
  }
}

// ==================== LOGOUT ====================
async function logout() {
  try {
    await fetch(SERVER_URL + "api/v1/auth/logout", {
      method: "POST",
      credentials: "include", // Important: Send cookies to backend for revocation
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Redirect to login regardless of success (user is logged out locally)
    window.location.href = "login.html";
  }
}

// ==================== UTILITY FUNCTIONS ====================
function showError(message) {
  if (!errorMessage) return;
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}

function clearError() {
  if (!errorMessage) return;
  errorMessage.textContent = "";
  errorMessage.style.display = "none";
}

// ==================== MAKE FUNCTIONS GLOBAL ====================
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.logout = logout;
