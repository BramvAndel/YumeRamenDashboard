/**
 * Utility Module
 * Contains common functions for authenticated API calls, tab management, and error handling
 */

// ==================== AUTHENTICATED FETCH ====================
/**
 * Wrapper around fetch() that automatically includes credentials (HTTP-only cookies)
 * Handles token refresh on 401 responses
 * @param {string} url - The endpoint URL
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} - The response object
 */
async function authenticatedFetch(url, options = {}) {
  const isFormData = options.body instanceof FormData;

  const defaultOptions = {
    credentials: "include",
    headers: isFormData
      ? { ...options.headers } // Browser sets proper multipart/form-data header automatically
      : {
          "Content-Type": "application/json",
          ...options.headers,
        },
  };

  const finalOptions = { ...defaultOptions, ...options };

  let response = await fetch(url, finalOptions);

  if (response.status === 401) {
    try {
      const refreshResponse = await fetch(SERVER_URL + "api/v1/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (refreshResponse.ok) {
        response = await fetch(url, finalOptions);
      } else {
        window.location.href = "login.html";
        return response;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      window.location.href = "login.html";
    }
  }

  return response;
}

// ==================== TAB MANAGEMENT ====================
/**
 * Switch to a different dashboard tab and save the preference
 * @param {string} tabId - The ID of the tab to show
 */
function showTab(tabId) {
  // Hide all tabs and remove active class
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show selected tab
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) {
    selectedTab.classList.add("active");
    localStorage.setItem("activeTab", tabId);
  }

  // Update nav item styles - remove active from all nav items
  const navItems = document.querySelectorAll("nav li");
  navItems.forEach((item) => {
    item.classList.remove("active");
  });

  // Add active class to the clicked nav item
  const activeNav = document.querySelector(`li[onclick="showTab('${tabId}')"]`);
  if (activeNav) {
    activeNav.classList.add("active");
  }
}

/**
 * Restore the user's last active tab on page load
 */
function restoreActiveTab() {
  const activeTab = localStorage.getItem("activeTab") || "dashboard";
  const tabElement = document.getElementById(activeTab);

  if (tabElement) {
    showTab(activeTab);
  } else {
    // Default to dashboard if saved tab doesn't exist
    showTab("dashboard");
  }
}

// ==================== ERROR DISPLAY ====================
/**
 * Display an error message across dashboard/orders/menu sections
 * @param {string} message - The error message to display
 */
function displayErrorState(message) {
  // Hide all content sections
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("orders").style.display = "none";
  document.getElementById("menu").style.display = "none";

  // Show error message
  const errorDiv = document.getElementById("error-state");
  if (errorDiv) {
    errorDiv.style.display = "block";
    const errorMessage = errorDiv.querySelector("p");
    if (errorMessage) {
      errorMessage.textContent = message;
    }
  }
}

// ==================== NOTIFICATION UTILS ====================
/**
 * Shows a notification ontop of the page, which you can x out of
 * @param {string} message - The message to display
 * @param {string} type - The type of message ('success' or 'error')
 */
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span class="message">${message}</span>
    <span class="close-btn">&times;</span>
  `;
  document.body.appendChild(notification);

  // Close button handler
  notification.querySelector(".close-btn").onclick = () => {
    document.body.removeChild(notification);
  };

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 5000);
}

// ==================== MAKE FUNCTIONS GLOBAL ====================
window.authenticatedFetch = authenticatedFetch;
window.showTab = showTab;
window.restoreActiveTab = restoreActiveTab;
window.displayErrorState = displayErrorState;
window.showNotification = showNotification;
