/**
 * books.js
 * Handles all book-related functionality including:
 * - Book search
 * - Book details display
 * - Popular books loading
 * - Hot books functionality
 */

import { currentUser } from './auth.js';
import { getStarsHTML, createErrorMessage, createLoadingIndicator } from './utils.js';
import { loadBookReviews } from './reviews.js';

/**
 * Performs a search for books based on the query in the search input
 * Updates the UI with search results
 */
function performSearch() {
    const query = document.getElementById('book-search').value || 
                  document.getElementById('search-page-input').value;
                  
    if (!query) {
        alert('Please enter a search term');
        return;
    }
    
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = createLoadingIndicator('Searching for books...');
    
    // Call the API to search for books
    fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(books => {
            if (books.length === 0) {
                searchResults.innerHTML = '<p class="no-results">No books found. Try a different search term.</p>';
                return;
            }
            
            // Generate HTML for search results
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
            
            // Add event listeners to book cards for navigation
            document.querySelectorAll('.book-card').forEach(card => {
                card.addEventListener('click', () => {
                    const bookId = card.dataset.id;
                    window.location.hash = `#/book/${bookId}`;
                });
            });
        })
        .catch(err => {
            console.error('Error searching books:', err);
            searchResults.innerHTML = createErrorMessage('Error searching books. Please try again later.');
        });
}

//show info for book
function showBookDetails(bookId) {
    // Get page elements
    const bookDetail = document.getElementById('book-detail');
    const homePage = document.getElementById('home-page');
    const hotBooksPage = document.getElementById('hot-books-page');
    const myReviewsPage = document.getElementById('my-reviews-page');
    const searchPage = document.getElementById('search-page');
    
    // Hide other pages and show book detail page
    homePage.style.display = 'none';
    hotBooksPage.style.display = 'none';
    myReviewsPage.style.display = 'none';
    searchPage.style.display = 'none';
    bookDetail.style.display = 'block';
    
    // Show loading indicators
    document.getElementById('book-info').innerHTML = createLoadingIndicator('Loading book details...');
    document.getElementById('book-reviews-list').innerHTML = createLoadingIndicator('Loading reviews...');
    
    // Load book details from API
    fetch(`/api/books/${bookId}`)
        .then(response => response.json())
        .then(book => {
            document.getElementById('book-info').innerHTML = `
                <img src="${book.thumbnail || '/img/default-book.png'}" alt="${book.title}" class="book-detail-image">
                <h2 class="book-detail-title">${book.title}</h2>
                <p class="book-detail-author">By ${book.author}</p>
                <p class="book-detail-description">${book.description}</p>
            `;
            
            // Set hidden form fields with book info for reviewing
            document.getElementById('bookId').value = book.id;
            document.getElementById('bookTitle').value = book.title;
            
            // Load book reviews
            loadBookReviews(book.id);
        })
        .catch(err => {
            console.error('Error loading book details:', err);
            document.getElementById('book-info').innerHTML = 
                createErrorMessage('Error loading book details. Please try again later.');
        });
}

/**
 * Loads popular books on the home page
 */
function loadHomeContent() {
    const popularBooksGrid = document.getElementById('popular-books-grid');
    const reviewsList = document.getElementById('reviewsList');
    const noReviewsMessage = document.getElementById('no-reviews-message');
    
    // Show loading state
    popularBooksGrid.innerHTML = createLoadingIndicator('Loading popular books...');
    
    // Load top rated books for the home page
    fetch('/api/books/top-rated')
        .then(response => response.json())
        .then(books => {
            const top3Books = books.slice(0, 3);
            
            if (top3Books.length === 0) {
                popularBooksGrid.innerHTML = '<p class="no-results">No books with ratings yet.</p>';
                return;
            }
            
            // Generate HTML for popular books
            popularBooksGrid.innerHTML = top3Books.map(book => {
                const stars = getStarsHTML(book.avgRating);
                
                return `
                    <div class="book-card" data-id="${book.id}">
                        <div class="book-image">
                            <img src="${book.thumbnail || '/img/default-book.png'}" alt="${book.title}">
                        </div>
                        <div class="book-info">
                            <div class="book-title">${book.title}</div>
                            <div class="book-author">By ${book.author}</div>
                            <div class="book-rating">
                                <div class="stars">${stars}</div>
                                <span class="rating-text">${Math.round(book.avgRating * 10) / 10}/10</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add event listeners to book cards for navigation
            document.querySelectorAll('#popular-books-grid .book-card').forEach(card => {
                card.addEventListener('click', () => {
                    const bookId = card.dataset.id;
                    window.location.hash = `#/book/${bookId}`;
                });
            });
        })
        .catch(err => {
            console.error('Error loading popular books:', err);
            popularBooksGrid.innerHTML = createErrorMessage('Error loading popular books.');
        });
    
    // Load latest reviews for the home page
    fetch('/api/reviews')
        .then(response => response.json())
        .then(reviews => {
            if (reviews.length === 0) {
                noReviewsMessage.style.display = 'block';
                reviewsList.innerHTML = '';
            } else {
                noReviewsMessage.style.display = 'none';
                
                // Generate HTML for latest reviews
                reviewsList.innerHTML = reviews.slice(0, 5).map(review => {
                    // Show delete button only for admins
                    const deleteButton = currentUser && currentUser.role === 'admin' ? 
                        `<button class="delete-review" data-id="${review.id}">Delete</button>` : '';
                    
                    const stars = getStarsHTML(review.rating);
                    
                    return `
                        <li class="review-item">
                            <div class="review-header">
                                <div class="review-book-info">
                                    <span class="review-title">${review.bookTitle}</span>
                                    <span class="review-author">Posted by ${review.username}</span>
                                </div>
                                <div class="stars">${stars}</div>
                            </div>
                            <div class="review-content">${review.reviewText}</div>
                            <div class="review-actions">
                                <button class="view-book" data-id="${review.bookId}">View Book</button>
                                ${deleteButton}
                            </div>
                        </li>
                    `;
                }).join('');
                
                // Add event listeners for review actions
                addReviewActionListeners();
            }
        })
        .catch(err => {
            console.error('Error loading reviews:', err);
            reviewsList.innerHTML = createErrorMessage('Error loading reviews.');
        });
}

/**
 * Adds event listeners to review action buttons
 */
function addReviewActionListeners() {
    // Add view book functionality
    document.querySelectorAll('.view-book').forEach(button => {
        button.addEventListener('click', () => {
            const bookId = button.dataset.id;
            window.location.hash = `#/book/${bookId}`;
        });
    });
    
    // Add delete functionality if delete buttons exist
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

//load hot books
function loadHotBooks(filter) {
    const hotBooksGrid = document.getElementById('hot-books-grid');
    hotBooksGrid.innerHTML = createLoadingIndicator('Loading hot books...');
    
    // Determine API endpoint based on filter
    const endpoint = filter === 'high-rated' ? '/api/books/top-rated' : '/api/books/most-recommended';
    
    fetch(endpoint)
        .then(response => response.json())
        .then(books => {
            if (books.length === 0) {
                hotBooksGrid.innerHTML = '<p class="no-results">No books found with enough ratings yet.</p>';
                return;
            }
            
            // Generate HTML for hot books
            hotBooksGrid.innerHTML = books.map(book => {
                // Display different rating info based on filter
                const ratingInfo = filter === 'high-rated' 
                    ? `<div class="stars">${getStarsHTML(book.avgRating)}</div>
                       <span>${Math.round(book.avgRating * 10) / 10}/10 (${book.reviewCount} reviews)</span>` 
                    : `<span class="recommend-percent">${book.recommendPercent}% recommended</span>`;
                
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
            
            // Add event listeners to book cards for navigation
            document.querySelectorAll('#hot-books-grid .book-card').forEach(card => {
                card.addEventListener('click', () => {
                    const bookId = card.dataset.id;
                    window.location.hash = `#/book/${bookId}`;
                });
            });
        })
        .catch(err => {
            console.error('Error loading hot books:', err);
            hotBooksGrid.innerHTML = createErrorMessage('Error loading books. Please try again later.');
        });
}

// Sets up event listeners for hot books page filtering

function setupHotBooksListeners() {
    // Add event listeners to filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const filter = e.target.dataset.filter;
            loadHotBooks(filter);
        });
    });
}

// Deletes a review and updates the UI accordingly
function deleteReview(reviewId) {
    return fetch(`/api/reviews/${reviewId}`, {
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
                
                return true;
            } else {
                throw new Error('Failed to delete review');
            }
        })
        .catch(err => {
            console.error('Error deleting review:', err);
            alert('Failed to delete review. Please try again.');
            return false;
        });
}

export { performSearch, showBookDetails, loadHomeContent, loadHotBooks, setupHotBooksListeners, deleteReview, addReviewActionListeners };