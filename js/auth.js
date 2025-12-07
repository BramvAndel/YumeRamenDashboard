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

                if (payload && (payload.role === 'admin' || payload.Role === 'admin')) {
                    // Save tokens in cookies
                    setCookie('accessToken', data.accessToken, 1); // 1 day
                    setCookie('refreshToken', data.refreshToken, 7); // 7 days
                    setCookie('userId', data.userId, 7);
                    
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
    const refreshToken = getCookie('refreshToken');
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
    
    eraseCookie('accessToken');
    eraseCookie('refreshToken');
    eraseCookie('userId');
    window.location.href = 'login.html';
}

const signupForm = document.getElementById('signup-form');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Clear previous error
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        // Validate passwords match
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch(SERVER_URL + 'api/v1/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username: firstName,
                    last_name: lastName,
                    email, 
                    password, 
                    phone_number: phone,
                    address,
                    role: 'user' 
                })
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

