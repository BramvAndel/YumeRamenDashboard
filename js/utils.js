// Tab Switching Logic
function showTab(tabId) {
    // Save current tab to cookie
    setCookie('activeTab', tabId, 7);

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Update sidebar active state
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.classList.remove('active');
        if(li.getAttribute('onclick').includes(tabId)) {
            li.classList.add('active');
        }
    });
}

function displayErrorState(message) {
    const errorMessage = `
        <div style="text-align: center; color: #e74c3c; padding: 40px; grid-column: 1 / -1;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
            <h2>Connection Error</h2>
            <p>${message}</p>
        </div>
    `;

    // Dashboard
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) statsGrid.innerHTML = errorMessage;
    
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) chartContainer.style.display = 'none';

    // Active Orders
    const activeOrdersList = document.getElementById('active-orders-list');
    if (activeOrdersList) activeOrdersList.innerHTML = errorMessage;

    // Completed Orders
    const completedOrdersList = document.getElementById('completed-orders-list');
    if (completedOrdersList) completedOrdersList.innerHTML = errorMessage;
}

async function authenticatedFetch(url, options = {}) {
    let token = getCookie('accessToken');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Set headers
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${token}`;

    let response = await fetch(url, options);

    // Handle both 401 (Unauthorized) and 403 (Forbidden) for token refresh
    // Some backends return 403 for expired tokens instead of 401
    if (response.status === 401 || response.status === 403) {
        
        // Token might be expired, try to refresh
        const refreshToken = getCookie('refreshToken');
        if (!refreshToken) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const refreshResponse = await fetch(SERVER_URL + 'api/v1/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: refreshToken })
            });

            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                setCookie('accessToken', data.accessToken, 1); // 1 day expiry for access token
                // Retry original request with new token
                options.headers['Authorization'] = `Bearer ${data.accessToken}`;
                response = await fetch(url, options);
            } else {
                console.error('Token refresh failed:', refreshResponse.status);
                // Refresh failed
                logout();
            }
        } catch (error) {
            console.error('Error during token refresh:', error);
            logout();
        }
    }

    return response;
}

function logout() {
    const refreshToken = getCookie('refreshToken');
    if (refreshToken) {
        // Use fetch without await since we're redirecting anyway
        // and don't want to block the UI
        fetch(SERVER_URL + 'api/v1/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: refreshToken })
        }).catch(err => console.error('Logout error:', err));
    }

    eraseCookie('accessToken');
    eraseCookie('refreshToken');
    eraseCookie('userId');
    window.location.href = 'login.html';
}

