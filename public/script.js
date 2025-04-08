document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authContainer = document.getElementById('auth-container');
    const mainContent = document.getElementById('main-content');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const homePage = document.getElementById('home-page');
    const myReviewsPage = document.getElementById('my-reviews-page');
    const bookDetail = document.getElementById('book-detail');
    const reviewsList = document.getElementById('reviewsList');
    const noReviewsMessage = document.getElementById('no-reviews-message');
    const popularBooksGrid = document.getElementById('popular-books-grid');
    const adminPage = document.getElementById('admin-page');
    const unauthorizedPage = document.getElementById('unauthorized-page');
    const searchPage = document.getElementById('search-page');
    
    // User state
    let currentUser = null;
    
    // Check if user is logged in
    function checkAuth() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            showMainContent();
            
            // Show admin navigation if user is admin
            if (currentUser.role === 'admin') {
                document.getElementById('nav-admin').parentElement.style.display = 'block';
                // Show all admin tabs for admin users
                document.querySelectorAll('.admin-tab').forEach(tab => {
                    tab.style.display = 'block';
                });
            } else {
                document.getElementById('nav-admin').parentElement.style.display = 'none';
                // Hide all admin tabs for non-admin users
                document.querySelectorAll('.admin-tab[data-tab="reviews"]').forEach(tab => {
                    tab.style.display = 'none';
                });
            }
            
            handleNavigation();
        }
    }
    
    // Handle URL hash navigation
    function handleNavigation() {
        const hash = window.location.hash || '#/home';
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Hide all pages
        homePage.style.display = 'none';
        myReviewsPage.style.display = 'none';
        bookDetail.style.display = 'none';
        adminPage.style.display = 'none';
        unauthorizedPage.style.display = 'none';
        searchPage.style.display = 'none';
        
        // Show the appropriate page based on hash
        if (hash.startsWith('#/home')) {
            document.getElementById('nav-home').classList.add('active');
            homePage.style.display = 'block';
            loadHomeContent();
        } else if (hash.startsWith('#/my-reviews')) {
            document.getElementById('nav-my-reviews').classList.add('active');
            myReviewsPage.style.display = 'block';
            loadMyReviews();
        } else if (hash.startsWith('#/search')) {
            document.getElementById('nav-search').classList.add('active');
            searchPage.style.display = 'block';
            // Focus on search input if the page is shown
            document.getElementById('search-page-input').focus();
        } else if (hash.startsWith('#/book/')) {
            const bookId = hash.split('/')[2];
            showBookDetails(bookId);
        } else if (hash.startsWith('#/admin')) {
            // Only allow admin users to access admin page
            document.getElementById('nav-admin').classList.add('active');
            if (currentUser && currentUser.role === 'admin') {
                adminPage.style.display = 'block';
                loadAdminContent();
            } else {
                // For non-admin users, show unauthorized page
                unauthorizedPage.style.display = 'block';
            }
        } else if (hash.startsWith('#/logout')) {
            logout();
            window.location.hash = '#/home';
        }
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleNavigation);
    
    // Show/hide auth sections
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    });
    
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
    });
    
    // Login Button - Use HTTP auth
    document.getElementById('login-btn').addEventListener('click', handleSimpleLogin);
    
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
                currentUser = userData.user; // Fix: Extract the user object from the response
                
                // Store password for admin users to use in future API calls
                if (currentUser.role === 'admin') {
                    // The actual password will be stored in a more secure way in a real app
                    currentUser.password = 'admin123'; // Default admin password
                }
                
                // Save to localStorage
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Update UI
                showMainContent();
                
                // Show success message
                alert(`Welcome, ${currentUser.username}!`);
                
                // Refresh page content
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('Login error:', error);
        });
    }
    
    // Registration Form
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        
        fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Registration failed');
                }
                return response.json();
            })
            .then(data => {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                showMainContent();
                window.location.hash = '#/home';
            })
            .catch(err => {
                console.error('Error during registration:', err);
                alert('Registration failed. Please try again with a different username.');
            });
    });
    
    // Logout functionality
    function logout() {
        localStorage.removeItem('currentUser');
        currentUser = null;
        authContainer.style.display = 'flex';
        mainContent.style.display = 'none';
        // Only reset the register form since loginForm doesn't exist
        if (document.getElementById('registerForm')) {
            document.getElementById('registerForm').reset();
        }
    }
    
    // Search functionality - Fix: remove references to non-existent elements
    // Setup search page functionality
    const searchPageButton = document.getElementById('search-page-button');
    if (searchPageButton) {
        searchPageButton.addEventListener('click', performSearch);
    }
    
    const searchPageInput = document.getElementById('search-page-input');
    if (searchPageInput) {
        searchPageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
    
    function performSearch() {
        const query = document.getElementById('search-page-input').value;
        if (!query) {
            alert('Please enter a search term');
            return;
        }
        
        const searchResults = document.getElementById('search-results');
        searchResults.innerHTML = '<p class="loading">Searching for books...</p>';
        
        fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(books => {
                if (books.length === 0) {
                    searchResults.innerHTML = '<p class="no-results">No books found. Try a different search term.</p>';
                    return;
                }
                
                searchResults.innerHTML = books.map(book => `
                    <div class="book-card" data-id="${book.id}" data-title="${book.title}">
                        <div class="book-image">
                            <img src="${book.thumbnail || '/img/default-book.png'}" alt="${book.title}">
                        </div>
                        <div class="book-info">
                            <div class="book-title">${book.title}</div>
                            <div class="book-author">By ${book.author}</div>
                        </div>
                    </div>
                `).join('');
                
                // Add event listeners to book cards
                document.querySelectorAll('.book-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const bookId = card.dataset.id;
                        window.location.hash = `#/book/${bookId}`;
                    });
                });
            })
            .catch(err => {
                console.error('Error searching books:', err);
                searchResults.innerHTML = '<p class="error">Error searching books. Please try again later.</p>';
            });
    }
    
    // Book details and review functionality
    function showBookDetails(bookId) {
        homePage.style.display = 'none';
        myReviewsPage.style.display = 'none';
        bookDetail.style.display = 'block';
        
        document.getElementById('book-info').innerHTML = '<p class="loading">Loading book details...</p>';
        document.getElementById('book-reviews-list').innerHTML = '<p class="loading">Loading reviews...</p>';
        
        // Load book details
        fetch(`/api/books/${bookId}`)
            .then(response => response.json())
            .then(book => {
                document.getElementById('book-info').innerHTML = `
                    <img src="${book.thumbnail || '/img/default-book.png'}" alt="${book.title}" class="book-detail-image">
                    <h2 class="book-detail-title">${book.title}</h2>
                    <p class="book-detail-author">By ${book.author}</p>
                    <p class="book-detail-description">${book.description}</p>
                `;
                document.getElementById('bookId').value = book.id;
                document.getElementById('bookTitle').value = book.title;
                
                // Load book reviews
                loadBookReviews(book.id);
            })
            .catch(err => {
                console.error('Error loading book details:', err);
                document.getElementById('book-info').innerHTML = '<p class="error">Error loading book details. Please try again later.</p>';
            });
    }
    
    function loadBookReviews(bookId) {
        fetch(`/api/reviews/book/${encodeURIComponent(bookId)}`)
            .then(response => response.json())
            .then(reviews => {
                const bookReviewsList = document.getElementById('book-reviews-list');
                if (reviews.length === 0) {
                    bookReviewsList.innerHTML = '<p class="no-results">No reviews yet. Be the first to review!</p>';
                } else {
                    bookReviewsList.innerHTML = reviews.map(review => {
                        const deleteButton = currentUser && currentUser.role === 'admin' ? 
                            `<button class="delete-review" data-id="${review.id}">Delete</button>` : '';
                        
                        const stars = getStarsHTML(review.rating);
                        const recommendBadge = review.recommended ? 
                            '<span class="review-recommend">Recommended</span>' :
                            '<span class="review-recommend not-recommended">Not Recommended</span>';
                        
                        return `
                            <li class="review-item">
                                <div class="review-header">
                                    <span class="review-author">Posted by ${review.username}</span>
                                    <div class="review-metadata">
                                        <div class="review-rating">
                                            <span class="stars">${stars}</span>
                                            <span>${review.rating}/10</span>
                                        </div>
                                        ${recommendBadge}
                                    </div>
                                </div>
                                <div class="review-content">${review.reviewText}</div>
                                <div class="review-actions">
                                    ${deleteButton}
                                </div>
                            </li>
                        `;
                    }).join('');
                    
                    // Add delete button functionality
                    addDeleteReviewListeners();
                }
            })
            .catch(err => {
                console.error('Error loading book reviews:', err);
                document.getElementById('book-reviews-list').innerHTML = '<p class="error">Error loading reviews.</p>';
            });
    }
    
    // Rating slider functionality
    const ratingSlider = document.getElementById('rating-slider');
    const ratingValue = document.getElementById('rating-value');
    
    if (ratingSlider) {
        ratingSlider.addEventListener('input', function() {
            ratingValue.textContent = this.value;
        });
    }
    
    // Submit review form
    document.getElementById('reviewForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('You must be logged in to submit a review.');
            return;
        }
        
        const bookId = document.getElementById('bookId').value;
        const bookTitle = document.getElementById('bookTitle').value;
        const reviewText = document.getElementById('reviewText').value;
        const rating = parseInt(document.getElementById('rating-slider').value);
        
        let recommended = false;
        const recommendInputs = document.querySelectorAll('input[name="recommend"]');
        for (const input of recommendInputs) {
            if (input.checked) {
                recommended = input.value === 'yes';
                break;
            }
        }
        
        fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                bookId,
                bookTitle,
                reviewText,
                rating,
                recommended
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to submit review');
                }
                return response.json();
            })
            .then(() => {
                alert('Review submitted successfully!');
                document.getElementById('reviewForm').reset();
                ratingValue.textContent = '5';
                ratingSlider.value = 5;
                loadBookReviews(bookId);
            })
            .catch(err => {
                console.error('Error submitting review:', err);
                alert('Failed to submit review. Please try again.');
            });
    });
    
    // Add event listeners to filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const filter = e.target.dataset.filter;
            loadHotBooks(filter);
        });
    });
    
    // Load Hot Books content
    function loadHotBooks(filter) {
        const hotBooksGrid = document.getElementById('hot-books-grid');
        hotBooksGrid.innerHTML = '<p class="loading">Loading hot books...</p>';
        
        const endpoint = filter === 'high-rated' ? '/api/books/top-rated' : '/api/books/most-recommended';
        
        fetch(endpoint)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }
                return response.json();
            })
            .then(books => {
                if (!books || books.length === 0) {
                    hotBooksGrid.innerHTML = '<p class="no-results">No books found with enough ratings yet. Please add some reviews!</p>';
                    return;
                }
                
                // Create book cards for each book in the list
                hotBooksGrid.innerHTML = books.map(book => {
                    // Default content for ratings or recommendations
                    let ratingInfo = '';
                    
                    // Different display based on filter
                    if (filter === 'high-rated') {
                        const stars = getStarsHTML(book.avgRating || 0);
                        ratingInfo = `
                            <div class="stars">${stars}</div>
                            <span>${Math.round((book.avgRating || 0) * 10) / 10}/10 (${book.reviewCount} reviews)</span>
                        `;
                    } else {
                        // For most recommended books
                        ratingInfo = `
                            <span class="recommend-percent">${book.recommendPercent || 0}% recommended</span>
                            <small>(${book.recommendCount || 0} of ${book.reviewCount} reviews)</small>
                        `;
                    }
                    
                    return `
                        <div class="book-card" data-id="${book.id}">
                            <div class="book-image">
                                <img src="${book.thumbnail || '/img/default-book.png'}" alt="${book.title}">
                            </div>
                            <div class="book-info">
                                <div class="book-title">${book.title}</div>
                                <div class="book-author">By ${book.author}</div>
                                <div class="book-rating">
                                    ${ratingInfo}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                // Add event listeners to book cards
                document.querySelectorAll('#hot-books-grid .book-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const bookId = card.dataset.id;
                        window.location.hash = `#/book/${bookId}`;
                    });
                });
            })
            .catch(err => {
                console.error('Error loading hot books:', err);
                hotBooksGrid.innerHTML = '<p class="error">Error loading books. Please add some reviews first!</p>';
            });
    }
    
    // Load My Reviews content
    function loadMyReviews() {
        if (!currentUser) {
            document.getElementById('my-reviews-list').innerHTML = '<p class="error">You must be logged in to view your reviews.</p>';
            return;
        }
        
        const myReviewsList = document.getElementById('my-reviews-list');
        myReviewsList.innerHTML = '<p class="loading">Loading your reviews...</p>';
        
        fetch(`/api/reviews/user/${currentUser.id}`)
            .then(response => response.json())
            .then(reviews => {
                if (reviews.length === 0) {
                    myReviewsList.innerHTML = '<p class="no-results">You haven\'t written any reviews yet.</p>';
                } else {
                    myReviewsList.innerHTML = reviews.map(review => {
                        const recommendBadge = review.recommended ? 
                            '<span class="review-recommend">Recommended</span>' :
                            '<span class="review-recommend not-recommended">Not Recommended</span>';
                        
                        return `
                            <li class="review-item">
                                <div class="review-header">
                                    <div class="review-book-info">
                                        <span class="review-title">${review.bookTitle}</span>
                                    </div>
                                    <div class="review-metadata">
                                        <div class="review-rating">
                                            <span class="rating-value">${review.rating}/10</span>
                                        </div>
                                        ${recommendBadge}
                                    </div>
                                </div>
                                <div class="review-content">${review.reviewText}</div>
                                <div class="review-actions">
                                    <button class="view-book" data-id="${review.bookId}">View Book</button>
                                </div>
                            </li>
                        `;
                    }).join('');
                    
                    // Add view book button functionality
                    document.querySelectorAll('.view-book').forEach(button => {
                        button.addEventListener('click', () => {
                            const bookId = button.dataset.id;
                            window.location.hash = `#/book/${bookId}`;
                        });
                    });
                }
            })
            .catch(err => {
                console.error('Error loading user reviews:', err);
                myReviewsList.innerHTML = '<p class="error">Error loading reviews.</p>';
            });
    }
    
    // Load home page content (only latest reviews)
    function loadHomeContent() {
        // Load latest reviews
        fetch('/api/reviews')
            .then(response => response.json())
            .then(reviews => {
                if (reviews.length === 0) {
                    noReviewsMessage.style.display = 'block';
                    reviewsList.innerHTML = '';
                } else {
                    noReviewsMessage.style.display = 'none';
                    reviewsList.innerHTML = reviews.slice(0, 5).map(review => {
                        const deleteButton = currentUser && currentUser.role === 'admin' ? 
                            `<button class="delete-review" data-id="${review.id}">Delete</button>` : '';
                        
                        const recommendedBadge = review.recommended ? 
                            '<span class="review-recommend">Recommended</span>' :
                            '<span class="review-recommend not-recommended">Not Recommended</span>';
                        
                        return `
                            <li class="review-item">
                                <div class="review-header">
                                    <div class="review-book-info">
                                        <span class="review-title">${review.bookTitle}</span>
                                        <span class="review-author">Posted by ${review.username}</span>
                                    </div>
                                    <div class="recommendation-badge">
                                        ${recommendedBadge}
                                    </div>
                                </div>
                                <div class="review-content">${review.reviewText}</div>
                                <div class="review-actions">
                                    <button class="view-book" data-id="${review.bookId}">View Book</button>
                                    ${deleteButton}
                                </div>
                            </li>
                        `;
                    }).join('');
                    
                    // Add delete button and view book functionality
                    addDeleteReviewListeners();
                    document.querySelectorAll('.view-book').forEach(button => {
                        button.addEventListener('click', () => {
                            const bookId = button.dataset.id;
                            window.location.hash = `#/book/${bookId}`;
                        });
                    });
                }
            })
            .catch(err => {
                console.error('Error loading reviews:', err);
                reviewsList.innerHTML = '<p class="error">Error loading reviews.</p>';
            });
    }
    
    // Helper functions
    function addDeleteReviewListeners() {
        document.querySelectorAll('.delete-review').forEach(button => {
            button.addEventListener('click', () => {
                if (!currentUser || currentUser.role !== 'admin') {
                    alert('Only admins can delete reviews.');
                    return;
                }
                
                const reviewId = button.dataset.id;
                if (confirm('Are you sure you want to delete this review?')) {
                    deleteReview(reviewId);
                }
            });
        });
    }
    
    function deleteReview(reviewId) {
        fetch(`/api/reviews/${reviewId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    alert('Review deleted successfully!');
                    // Refresh the page content based on current page
                    if (window.location.hash.startsWith('#/home')) {
                        loadHomeContent();
                    } else if (window.location.hash.startsWith('#/book/')) {
                        const bookId = window.location.hash.split('/')[2];
                        loadBookReviews(bookId);
                    } else if (window.location.hash.startsWith('#/hot-books')) {
                        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
                        loadHotBooks(activeFilter);
                    }
                } else {
                    throw new Error('Failed to delete review');
                }
            })
            .catch(err => {
                console.error('Error deleting review:', err);
                alert('Failed to delete review. Please try again.');
            });
    }
    
    function getStarsHTML(rating) {
        const fullStars = Math.floor(rating / 2);
        const halfStar = rating % 2 >= 1 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        
        return `${'★'.repeat(fullStars)}${halfStar ? '½' : ''}${'☆'.repeat(emptyStars)}`;
    }
    
    // Show main content after login/register
    function showMainContent() {
        authContainer.style.display = 'none';
        mainContent.style.display = 'block';
    }
    
    // Admin functionality
    function loadAdminContent() {
        // Check if user is admin before processing anything
        if (!currentUser || currentUser.role !== 'admin') {
            // Hide all admin content tabs
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // Show unauthorized page
            document.getElementById('unauthorized-page').style.display = 'block';
            return;
        }
        
        // Set up tab switching
        document.querySelectorAll('.admin-tab').forEach(tab => {
            // Hide reviews tab for non-admin users
            if (tab.dataset.tab === 'reviews' && (!currentUser || currentUser.role !== 'admin')) {
                tab.style.display = 'none';
            } else {
                tab.style.display = 'block';
            }
            
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                // Prevent access to reviews tab for non-admin users
                if (tabId === 'reviews' && (!currentUser || currentUser.role !== 'admin')) {
                    alert('You do not have permission to access this feature.');
                    return;
                }
                
                // Update active tab
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show relevant content
                document.querySelectorAll('.admin-tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                document.getElementById(`admin-${tabId}`).style.display = 'block';
                
                // Load content based on tab
                if (tabId === 'users') {
                    loadAdminUsers();
                } else if (tabId === 'reviews') {
                    loadAdminReviews();
                }
            });
        });
        
        // Load users by default
        loadAdminUsers();
        
        // Add event listener for back button on unauthorized page
        document.getElementById('back-to-home').addEventListener('click', () => {
            window.location.hash = '#/home';
        });
    }

    function loadAdminUsers() {
        const tableBody = document.getElementById('users-table-body');
        if (!tableBody) {
            console.error('Cannot find users-table-body element');
            return;
        }
        
        // Check if user is admin before loading any data
        if (!currentUser || currentUser.role !== 'admin') {
            tableBody.innerHTML = '<tr><td colspan="4" class="error">Unauthorized: Admin access required</td></tr>';
            return;
        }
        
        tableBody.innerHTML = '<tr><td colspan="4" class="loading">Loading users...</td></tr>';
        
        // Get current user from localStorage for authentication
        let headers = {};
        
        // Create auth header
        const password = currentUser.password || 'admin123';
        const credentials = btoa(`${currentUser.username}:${password}`);
        headers = {
            'Authorization': `Basic ${credentials}`
        };
        
        fetch('/api/admin/users', {
            headers: headers
        })
            .then(response => {
                console.log('Admin API response status:', response.status);
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                return response.json();
            })
            .then(users => {
                if (users.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4">No users found</td></tr>';
                    return;
                }
                
                tableBody.innerHTML = users.map(user => {
                    const isAdmin = user.role === 'admin';
                    const deleteBtn = isAdmin ? 
                        '' : 
                        `<button class="delete-btn delete-user" data-id="${user.id}">Delete</button>`;
                    const usernameClass = isAdmin ? 'admin-user' : '';
                    
                    return `
                        <tr>
                            <td>${user.id}</td>
                            <td class="${usernameClass}">${user.username}</td>
                            <td>${user.role}</td>
                            <td>${deleteBtn}</td>
                        </tr>
                    `;
                }).join('');
                
                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-user').forEach(button => {
                    button.addEventListener('click', () => {
                        const userId = button.dataset.id;
                        if (confirm('Are you sure you want to delete this user? This will also delete all their reviews.')) {
                            deleteUser(userId);
                        }
                    });
                });
            })
            .catch(err => {
                console.error('Error loading users:', err);
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="4" class="error">Error loading users: ' + err.message + '</td></tr>';
                }
                
                // Show unauthorized message if the request failed due to auth issues
                if (err.message && (err.message.includes('401') || err.message.includes('403'))) {
                    document.getElementById('unauthorized-page').style.display = 'block';
                    document.getElementById('admin-users').style.display = 'none';
                    document.getElementById('admin-reviews').style.display = 'none';
                }
            });
    }

    function loadAdminReviews() {
        const tableBody = document.getElementById('reviews-table-body');
        
        // Check if user is admin before loading reviews
        if (!currentUser || currentUser.role !== 'admin') {
            tableBody.innerHTML = '<tr><td colspan="7" class="error">Unauthorized: Admin access required</td></tr>';
            document.getElementById('unauthorized-page').style.display = 'block';
            document.getElementById('admin-reviews').style.display = 'none';
            return;
        }
        
        tableBody.innerHTML = '<tr><td colspan="7" class="loading">Loading reviews...</td></tr>';
        
        fetch('/api/reviews')
            .then(response => response.json())
            .then(reviews => {
                if (reviews.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="7">No reviews found</td></tr>';
                    return;
                }
                
                tableBody.innerHTML = reviews.map(review => {
                    const recommendedText = review.recommended ? 
                        '<span class="recommended">Yes</span>' : 
                        '<span class="not-recommended">No</span>';
                    
                    return `
                        <tr>
                            <td>${review.id}</td>
                            <td>${review.username}</td>
                            <td>${review.bookTitle}</td>
                            <td>${review.rating}/10</td>
                            <td>${recommendedText}</td>
                            <td class="review-text">${review.reviewText}</td>
                            <td>
                                <button class="delete-btn delete-review" data-id="${review.id}">Delete</button>
                            </td>
                        </tr>
                    `;
                }).join('');
                
                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-review').forEach(button => {
                    button.addEventListener('click', () => {
                        const reviewId = button.dataset.id;
                        if (confirm('Are you sure you want to delete this review?')) {
                            deleteReview(reviewId).then(() => {
                                loadAdminReviews(); // Reload reviews after deletion
                            });
                        }
                    });
                });
            })
            .catch(err => {
                console.error('Error loading reviews:', err);
                tableBody.innerHTML = '<tr><td colspan="7" class="error">Error loading reviews</td></tr>';
            });
    }

    function deleteUser(userId) {
        // Get current user from localStorage for authentication
        const currentUserData = localStorage.getItem('currentUser');
        let headers = {};
        
        if (currentUserData) {
            const user = JSON.parse(currentUserData);
            // Create Basic Auth header using the current user's credentials
            const credentials = btoa(`${user.username}:admin123`);
            headers = {
                'Authorization': `Basic ${credentials}`
            };
        }
        
        fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: headers
        })
            .then(response => {
                if (response.ok) {
                    alert('User deleted successfully!');
                    loadAdminUsers(); // Reload users after deletion
                } else {
                    throw new Error('Failed to delete user');
                }
            })
            .catch(err => {
                console.error('Error deleting user:', err);
                alert('Failed to delete user. Please try again.');
            });
    }
    
    // Initialize app
    checkAuth();
});