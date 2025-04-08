/**
 * navigation.js
 * Handles all navigation-related functionality including:
 * - Hash-based routing
 * - Page display management
 * - Navigation event listeners
 */

// Import dependencies
import { currentUser, logout } from './auth.js';
import { loadHomeContent } from './books.js';
import { loadMyReviews } from './reviews.js';
import { loadAdminContent } from './admin.js';
import { performSearch, loadHotBooks, showBookDetails } from './books.js';

/**
 * Sets up navigation event listeners
 */
function setupNavigationListeners() {
    // Listen for hash changes to handle navigation
    window.addEventListener('hashchange', handleNavigation);
    
    // Set up search functionality
    document.getElementById('search-button').addEventListener('click', () => {
        window.location.hash = '#/search';
    });
    
    document.getElementById('book-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.location.hash = '#/search';
        }
    });
    
    // Add event listener for search page submit button if it exists
    const searchSubmitButton = document.getElementById('search-submit');
    if (searchSubmitButton) {
        searchSubmitButton.addEventListener('click', () => {
            performSearch();
        });
    }
}

/**
 * Handles navigation based on URL hash
 * Shows appropriate page content and updates active navigation state
 */
function handleNavigation() {
    // Get the current hash
    const hash = window.location.hash || '#/home';
    
    // Reset all pages and active nav states
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('active');
    });
    
    // Get page elements
    const homePage = document.getElementById('home-page');
    const searchPage = document.getElementById('search-page');
    const myReviewsPage = document.getElementById('my-reviews-page');
    const bookDetailPage = document.getElementById('book-detail');
    const adminPage = document.getElementById('admin-page');
    const unauthorizedPage = document.getElementById('unauthorized-page');
    
    // Get the current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Handle navigation based on hash
    if (hash === '#/home' || hash === '') {
        document.getElementById('nav-home').classList.add('active');
        homePage.style.display = 'block';
        loadHomeContent();
    } else if (hash === '#/search') {
        document.getElementById('nav-search').classList.add('active');
        searchPage.style.display = 'block';
    } else if (hash === '#/my-reviews') {
        if (currentUser) {
            document.getElementById('nav-my-reviews').classList.add('active');
            myReviewsPage.style.display = 'block';
            loadMyReviews(currentUser.id);
        } else {
            // Redirect to home if not logged in
            window.location.hash = '#/home';
        }
    } else if (hash.startsWith('#/book/')) {
        const bookId = hash.split('/')[2];
        bookDetailPage.style.display = 'block';
        showBookDetails(bookId);
    } else if (hash.startsWith('#/admin')) {
        // Check if user is an admin before showing admin page
        if (currentUser && currentUser.role === 'admin') {
            document.getElementById('nav-admin').classList.add('active');
            adminPage.style.display = 'block';
            loadAdminContent();
        } else {
            // Show unauthorized page if not admin
            unauthorizedPage.style.display = 'block';
        }
    } else if (hash.startsWith('#/logout')) {
        logout();
        window.location.hash = '#/home';
    }
}

export { setupNavigationListeners, handleNavigation };