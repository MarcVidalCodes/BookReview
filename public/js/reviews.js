// reviews.js
// Handles all review-related functionality including:
// - Loading book reviews
// - Loading user reviews
// - Review submission
// - Review deletion

import { currentUser } from './auth.js';
import { getStarsHTML, createErrorMessage, createLoadingIndicator } from './utils.js';
import { deleteReview } from './books.js';

// Loads reviews for a specific book
function loadBookReviews(bookId) {
    const bookReviewsList = document.getElementById('book-reviews-list');
    bookReviewsList.innerHTML = createLoadingIndicator('Loading reviews...');
    
    fetch(`/api/reviews/book/${encodeURIComponent(bookId)}`)
        .then(response => response.json())
        .then(reviews => {
            if (reviews.length === 0) {
                bookReviewsList.innerHTML = '<p class="no-results">No reviews yet. Be the first to review!</p>';
            } else {
                bookReviewsList.innerHTML = reviews.map(review => {
                    // Show delete button only for admin users
                    const deleteButton = currentUser && currentUser.role === 'admin' ? 
                        `<button class="delete-review" data-id="${review.id}">Delete</button>` : '';
                    
                    const stars = getStarsHTML(review.rating);
                    
                    // Show recommendation badge
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
                
                // Add event listeners to delete buttons
                addDeleteReviewListeners();
            }
        })
        .catch(err => {
            console.error('Error loading book reviews:', err);
            bookReviewsList.innerHTML = createErrorMessage('Error loading reviews.');
        });
}

// Loads reviews written by the current user
function loadMyReviews() {
    const myReviewsList = document.getElementById('my-reviews-list');
    
    if (!currentUser) {
        myReviewsList.innerHTML = createErrorMessage('You must be logged in to view your reviews.');
        return;
    }
    
    myReviewsList.innerHTML = createLoadingIndicator('Loading your reviews...');
    
    fetch(`/api/reviews/user/${currentUser.id}`)
        .then(response => response.json())
        .then(reviews => {
            if (reviews.length === 0) {
                myReviewsList.innerHTML = '<p class="no-results">You haven\'t written any reviews yet.</p>';
            } else {
                myReviewsList.innerHTML = reviews.map(review => {
                    // Show recommendation badge
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
                
                // Add event listeners to view book buttons
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
            myReviewsList.innerHTML = createErrorMessage('Error loading reviews.');
        });
}

// Adds event listeners to delete review buttons
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

// Sets up review form event listeners and functionality
function setupReviewForm() {
    // Set up rating slider
    const ratingSlider = document.getElementById('rating-slider');
    const ratingValue = document.getElementById('rating-value');
    
    if (ratingSlider && ratingValue) {
        ratingSlider.addEventListener('input', function() {
            ratingValue.textContent = this.value;
        });
    }
    
    // Set up review form submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!currentUser) {
                alert('You must be logged in to submit a review.');
                return;
            }
            
            const bookId = document.getElementById('bookId').value;
            const bookTitle = document.getElementById('bookTitle').value;
            const reviewText = document.getElementById('reviewText').value;
            const rating = parseInt(document.getElementById('rating-slider').value);
            
            // Determine recommendation value
            let recommended = false;
            const recommendInputs = document.querySelectorAll('input[name="recommend"]');
            for (const input of recommendInputs) {
                if (input.checked) {
                    recommended = input.value === 'yes';
                    break;
                }
            }
            
            // Submit review to API
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
                    
                    // Reset form
                    reviewForm.reset();
                    ratingValue.textContent = '5';
                    ratingSlider.value = 5;
                    
                    // Reload reviews to show new review
                    loadBookReviews(bookId);
                })
                .catch(err => {
                    console.error('Error submitting review:', err);
                    alert('Failed to submit review. Please try again.');
                });
        });
    }
}

export { loadBookReviews, loadMyReviews, addDeleteReviewListeners, setupReviewForm };