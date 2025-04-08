/**
 * auth.js
 * Handles user authentication functionality including:
 * - Login
 * - Registration
 * - Logout
 * - Session management
 */

import { createErrorMessage, createLoadingIndicator } from './utils.js';

// Store the current logged-in user
let currentUser = null;

// Load user data from localStorage on page load
function loadUserFromStorage() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            return true;
        } catch (e) {
            console.error('Error parsing stored user data:', e);
            localStorage.removeItem('currentUser');
        }
    }
    return false;
}

// Initialize when the module loads
loadUserFromStorage();

// Event listeners for authentication forms
document.addEventListener('DOMContentLoaded', () => {
    // Check for existing login session on page load
    checkSession();
    
    // Set up login button listener (for simplified HTTP auth)
    const loginButton = document.getElementById('login-btn');
    if (loginButton) {
        loginButton.addEventListener('click', handleSimpleLogin);
    }
    
    // Set up register form listener
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Set up logout button listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Listen for auth modal open requests
    document.querySelectorAll('.open-login-modal').forEach(btn => {
        btn.addEventListener('click', showLoginModal);
    });
    
    document.querySelectorAll('.open-register-modal').forEach(btn => {
        btn.addEventListener('click', showRegisterModal);
    });
});

// Checks if user has an active session and updates UI accordingly
function checkSession() {
    if (isUserLoggedIn()) {
        // User is logged in
        updateAuthUI(true);
        
        // Display username in header
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            userDisplay.textContent = currentUser.username;
        }
        
        // Show admin elements if user is admin
        if (isUserAdmin()) {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'block';
            });
        }
    } else {
        // No active session
        updateAuthUI(false);
    }
}

//Handles the simplified login process using HTTP Basic Auth directly
function handleSimpleLogin() {
    // Trigger HTTP authentication directly by making a request to a protected endpoint
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                // The browser will automatically show the HTTP auth dialog
                return null;
            }
            throw new Error('Login failed');
        }
        return response.json();
    })
    .then(userData => {
        if (userData) {
            // Save user info including password for admin users
            currentUser = userData;
            
            // Store password for admin users to use in future API calls
            if (userData.role === 'admin') {
                // The actual password will be stored in a more secure way in a real app
                currentUser.password = 'admin123'; // Default admin password
            }
            
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateAuthUI(true);
            
            // Show success message
            alert(`Welcome, ${userData.username}!`);
            
            // Refresh page content
            window.location.reload();
        }
    })
    .catch(error => {
        console.error('Login error:', error);
    });
}

//Handles the registration form submission

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const statusMessage = document.getElementById('register-status');
    
    // Basic validation
    if (!username || !password || !confirmPassword) {
        statusMessage.innerHTML = createErrorMessage('Please fill out all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        statusMessage.innerHTML = createErrorMessage('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        statusMessage.innerHTML = createErrorMessage('Password must be at least 6 characters');
        return;
    }
    
    statusMessage.innerHTML = createLoadingIndicator('Creating account...');
    
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            throw new Error('Registration failed');
        }
        
        const userData = await response.json();
        
        // Save user data to localStorage
        currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Registration successful
        updateAuthUI(true);
        
        // Close modal
        closeModals();
        
        // Clear form
        document.getElementById('register-form').reset();
        
        // Show success message
        alert(`Welcome, ${userData.username}! Your account has been created.`);
        
        // Refresh page content
        window.location.reload();
    } catch (error) {
        console.error('Registration error:', error);
        statusMessage.innerHTML = createErrorMessage('Failed to create account. Username may already be taken.');
    }
}

//loguout
function handleLogout() {
    logoutUser();
    
    // Update UI
    updateAuthUI(false);
    
    alert('You have been logged out.');
    
    // Refresh page content
    window.location.reload();
}

//update ui with auth
function updateAuthUI(isLoggedIn) {
    if (isLoggedIn) {
        // Show logged-in elements
        document.querySelectorAll('.logged-in-only').forEach(el => {
            el.style.display = 'block';
        });
        
        // Hide logged-out elements
        document.querySelectorAll('.logged-out-only').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show admin elements if user is admin
        if (isUserAdmin()) {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'block';
            });
            
            // Show admin nav item specifically
            const adminNavItem = document.getElementById('nav-admin');
            if (adminNavItem) {
                adminNavItem.parentElement.style.display = 'block';
            }
        } else {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'none';
            });
            
            // Hide admin nav item specifically
            const adminNavItem = document.getElementById('nav-admin');
            if (adminNavItem) {
                adminNavItem.parentElement.style.display = 'none';
            }
        }
    } else {
        // Show logged-out elements
        document.querySelectorAll('.logged-out-only').forEach(el => {
            el.style.display = 'block';
        });
        
        // Hide logged-in elements
        document.querySelectorAll('.logged-in-only').forEach(el => {
            el.style.display = 'none';
        });
        
        // Hide admin elements
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
        
        // Hide admin nav item specifically
        const adminNavItem = document.getElementById('nav-admin');
        if (adminNavItem) {
            adminNavItem.parentElement.style.display = 'none';
        }
    }
}

//login modal
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

//register modal
function showRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('register-username').focus();
    }
}

//close modals
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Close modal when clicking outside content
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        closeModals();
    }
});

// Close modal when pressing escape
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModals();
    }
});

// Setup close button listeners
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeModals);
});

//check to see if user log in
export function isUserLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}

//current user
export function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

//checks to see if user is admin
export function isUserAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

//logout
export function logoutUser() {
    localStorage.removeItem('currentUser');
}

export {
    handleSimpleLogin,
    handleLogout,
    showLoginModal,
    showRegisterModal
};