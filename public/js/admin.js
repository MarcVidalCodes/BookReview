//admin panel

import { isUserAdmin, getCurrentUser } from './auth.js';
import { createLoadingIndicator, createErrorMessage } from './utils.js';


 // Load admin page content
export function loadAdminContent() {
    // Check if admin content container exists before proceeding
    const adminContent = document.getElementById('admin-content');
    if (!adminContent) {
        console.warn('Admin content element not found on this page');
        return;
    }

    // Display loading indicator
    adminContent.innerHTML = createLoadingIndicator('Loading admin panel...');
    
    // Check if user is admin
    const user = getCurrentUser();
    if (user) {
        console.log('Loading admin users with user:', user.username, 'Role:', user.role);
        
        if (!isUserAdmin()) {
            console.log('User is not admin, will show unauthorized message');
            adminContent.innerHTML = createErrorMessage('You do not have permission to access this page');
            return;
        }
        
        // User is admin, load admin dashboard
        loadAdminUsers();
    } else {
        console.log('No user is logged in');
        adminContent.innerHTML = createErrorMessage('You must be logged in as an admin to access this page');
    }
}


 //Load admin user management section
async function loadAdminUsers() {
    // Check if admin content container exists before proceeding
    const adminContent = document.getElementById('admin-content');
    if (!adminContent) {
        console.warn('Admin content element not found when loading users');
        return;
    }

    const user = getCurrentUser();
    
    try {
        // Create auth header
        console.log('Created auth header for admin user');
        
        // Fetch users data from API
        const response = await fetch('/api/admin/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(`${user.username}:${user.password || 'admin123'}`)
            }
        });
        
        console.log('Admin API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const users = await response.json();
        
        // Render users table
        renderUsersTable(users);
    } catch (error) {
        console.error('Error loading users:', error);
        adminContent.innerHTML = createErrorMessage('Failed to load admin data. ' + error.message);
    }
}


 //Render the users management table
function renderUsersTable(users) {
    // Check if admin content container exists before proceeding
    const adminContent = document.getElementById('admin-content');
    if (!adminContent) {
        console.warn('Admin content element not found when rendering user table');
        return;
    }

    // Build HTML for admin panel
    let html = `
        <h2>User Management</h2>
        <div class="admin-controls">
            <button id="add-user-btn" class="btn primary">Add New User</button>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add rows for each user
    users.forEach(user => {
        const created = new Date(user.created_at).toLocaleDateString();
        
        html += `
            <tr data-userid="${user.id}">
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>
                    <select class="role-select" data-userid="${user.id}">
                        <option value="guest" ${user.role === 'guest' ? 'selected' : ''}>Guest</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td>${created}</td>
                <td>
                    <button class="btn small delete-user" data-userid="${user.id}">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    // Update the admin panel content
    adminContent.innerHTML = html;
    
    // Add event listeners to the role selects
    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', handleRoleChange);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-user').forEach(button => {
        button.addEventListener('click', handleUserDelete);
    });
    
    // Add event listener to add user button
    document.getElementById('add-user-btn').addEventListener('click', showAddUserModal);
}


// Handle role change for a user
async function handleRoleChange(event) {
    const userId = event.target.dataset.userid;
    const newRole = event.target.value;
    const user = getCurrentUser();
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(`${user.username}:${user.password || 'admin123'}`)
            },
            body: JSON.stringify({ role: newRole })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        alert('User role updated successfully');
    } catch (error) {
        console.error('Error updating user role:', error);
        alert('Failed to update user role');
        // Reset select to previous value
        loadAdminUsers();
    }
}


//  Handle user deletion
async function handleUserDelete(event) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    const userId = event.target.dataset.userid;
    const user = getCurrentUser();
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(`${user.username}:${user.password || 'admin123'}`)
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        // Remove the user row from the table
        document.querySelector(`tr[data-userid="${userId}"]`).remove();
        alert('User deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    }
}


 // Show the add user modal
function showAddUserModal() {
    // Check if modal already exists
    let modal = document.getElementById('add-user-modal');
    
    if (!modal) {
        // Create modal HTML
        modal = document.createElement('div');
        modal.id = 'add-user-modal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Add New User</h2>
                <form id="add-user-form">
                    <div class="form-group">
                        <label for="new-username">Username:</label>
                        <input type="text" id="new-username" required>
                    </div>
                    <div class="form-group">
                        <label for="new-password">Password:</label>
                        <input type="password" id="new-password" required>
                    </div>
                    <div class="form-group">
                        <label for="new-role">Role:</label>
                        <select id="new-role">
                            <option value="guest">Guest</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="form-controls">
                        <button type="submit" class="btn primary">Add User</button>
                        <button type="button" class="btn close-modal">Cancel</button>
                    </div>
                    <div id="add-user-status"></div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listener for form submission
        document.getElementById('add-user-form').addEventListener('submit', handleAddUser);
        
        // Add event listeners for closing the modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close when clicking outside
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Display the modal
    modal.style.display = 'flex';
}


 // Handle adding a new user
async function handleAddUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;
    const statusEl = document.getElementById('add-user-status');
    
    statusEl.innerHTML = createLoadingIndicator('Adding user...');
    
    const user = getCurrentUser();
    
    try {
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(`${user.username}:${user.password || 'admin123'}`)
            },
            body: JSON.stringify({ username, password, role })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        // Hide modal
        document.getElementById('add-user-modal').style.display = 'none';
        
        // Reload user table
        loadAdminUsers();
        
        alert('User added successfully');
    } catch (error) {
        console.error('Error adding user:', error);
        statusEl.innerHTML = createErrorMessage('Failed to add user. ' + error.message);
    }
}

 // Load admin reviews management section
async function loadAdminReviews() {
    // Check if admin content container exists before proceeding
    const adminContent = document.getElementById('admin-content');
    if (!adminContent) {
        console.warn('Admin content element not found when loading reviews');
        return;
    }

    const user = getCurrentUser();
    
    try {
        // Fetch reviews data from API with authentication
        const response = await fetch('/api/admin/reviews', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(`${user.username}:${user.password || 'admin123'}`)
            }
        });
        
        console.log('Admin reviews API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const reviews = await response.json();
        
        // Render reviews table
        renderReviewsTable(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        adminContent.innerHTML = createErrorMessage('Failed to load reviews data. ' + error.message);
    }
}


 // Render the reviews management table
function renderReviewsTable(reviews) {
    // Check if admin content container exists before proceeding
    const adminContent = document.getElementById('admin-content');
    if (!adminContent) {
        console.warn('Admin content element not found when rendering reviews table');
        return;
    }

    // Build HTML for reviews panel
    let html = `
        <h2>Review Management</h2>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Book Title</th>
                        <th>Rating</th>
                        <th>Recommended</th>
                        <th>Review</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add rows for each review
    reviews.forEach(review => {
        const timestamp = new Date(review.timestamp).toLocaleDateString();
        const truncatedReview = review.reviewText.length > 50 ? 
            review.reviewText.substring(0, 50) + '...' : 
            review.reviewText;
        
        html += `
            <tr data-reviewid="${review.id}">
                <td>${review.id}</td>
                <td>${review.username}</td>
                <td><a href="/book?id=${review.bookId}" target="_blank">${review.bookTitle}</a></td>
                <td>${review.rating}/5</td>
                <td>${review.recommended ? 'Yes' : 'No'}</td>
                <td title="${review.reviewText}">${truncatedReview}</td>
                <td>${timestamp}</td>
                <td>
                    <button class="btn small view-review" data-reviewid="${review.id}">View</button>
                    <button class="btn small delete-review" data-reviewid="${review.id}">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    // Update the admin panel content
    adminContent.innerHTML = html;
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-review').forEach(button => {
        button.addEventListener('click', handleReviewView);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-review').forEach(button => {
        button.addEventListener('click', handleReviewDelete);
    });
}


 // Handle viewing a review
function handleReviewView(event) {
    const reviewId = event.target.dataset.reviewid;
    const row = document.querySelector(`tr[data-reviewid="${reviewId}"]`);
    const reviewText = row.querySelector('td:nth-child(6)').title;
    const username = row.querySelector('td:nth-child(2)').textContent;
    const bookTitle = row.querySelector('td:nth-child(3)').textContent;
    
    // Show review details in modal
    showReviewModal(reviewId, username, bookTitle, reviewText);
}

// Show review details in a modal

function showReviewModal(id, username, bookTitle, reviewText) {
    // Check if modal already exists
    let modal = document.getElementById('review-modal');
    
    if (!modal) {
        // Create modal HTML
        modal = document.createElement('div');
        modal.id = 'review-modal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Review Details</h2>
                <div id="review-detail-content"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners for closing the modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close when clicking outside
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Update content
    const contentDiv = document.getElementById('review-detail-content');
    contentDiv.innerHTML = `
        <div class="review-detail">
            <p><strong>ID:</strong> ${id}</p>
            <p><strong>User:</strong> ${username}</p>
            <p><strong>Book:</strong> ${bookTitle}</p>
            <h3>Review Content:</h3>
            <div class="review-text">${reviewText}</div>
        </div>
    `;
    
    // Display the modal
    modal.style.display = 'flex';
}

//Handle review deletion
async function handleReviewDelete(event) {
    if (!confirm('Are you sure you want to delete this review?')) {
        return;
    }
    
    const reviewId = event.target.dataset.reviewid;
    const user = getCurrentUser();
    
    try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(`${user.username}:${user.password || 'admin123'}`)
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        // Remove the review row from the table
        document.querySelector(`tr[data-reviewid="${reviewId}"]`).remove();
        alert('Review deleted successfully');
    } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review');
    }
}

// Set up admin tab event listeners
export function setupAdminTabs() {
    // Get all admin tab buttons
    const adminTabButtons = document.querySelectorAll('.admin-tab');
    if (adminTabButtons.length === 0) return;
    
    // Add event listeners
    adminTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabType = this.dataset.tab;
            
            // Remove active class from all tabs
            adminTabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to current tab
            this.classList.add('active');
            
            // Load appropriate content
            if (tabType === 'users') {
                loadAdminUsers();
            } else if (tabType === 'reviews') {
                loadAdminReviews();
            }
        });
    });
    
    // Activate default tab (users)
    const defaultTab = document.querySelector('.admin-tab[data-tab="users"]');
    if (defaultTab) {
        defaultTab.click();
    }
}

// Initialize admin tabs when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we are on admin page
    if (document.getElementById('admin-content')) {
        setupAdminTabs();
    }
});