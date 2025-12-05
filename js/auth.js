const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Clear previous error
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        try {
            const response = await fetch(SERVER_URL + 'api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Check for admin role in token
                const payload = parseJwt(data.accessToken);
                console.log('Decoded JWT Payload:', payload); // Debugging

                if (payload && (payload.role === 'admin' || payload.Role === 'admin')) {
                    // Save tokens
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    
                    // Redirect to dashboard
                    window.location.href = 'index.html';
                } else {
                    console.warn('Access denied. Role is:', payload ? payload.role : 'undefined');
                    showError('Access denied. Admin privileges required.');
                }
            } else {
                showError(data.message || 'Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Connection error. Please try again.');
        }
    });
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Logout function
async function logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
        try {
            await fetch(SERVER_URL + 'api/v1/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: refreshToken })
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = 'login.html';
}

const signupForm = document.getElementById('signup-form');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Clear previous error
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        try {
            const response = await fetch(SERVER_URL + 'api/v1/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, role: 'user' })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Account created successfully! Please sign in.');
                window.location.href = 'login.html';
            } else {
                showError(data.message || 'Failed to create account');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showError('Connection error. Please try again.');
        }
    });
}

