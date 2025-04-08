/**
 * utils.js
 * Contains utility functions used across different modules
 */

// Converts a rating value to HTML star representation
function getStarsHTML(rating) {
    // Convert 0-10 scale to 0-5 for star display
    const normalizedRating = rating / 2;
    const fullStars = Math.floor(normalizedRating);
    const halfStar = normalizedRating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return `${'★'.repeat(fullStars)}${halfStar ? '½' : ''}${'☆'.repeat(emptyStars)}`;
}

//create error message
function createErrorMessage(message) {
    return `<p class="error">${message}</p>`;
}
//
//  Creates a standardized loading indicator
function createLoadingIndicator(message = 'Loading...') {
    return `<p class="loading">${message}</p>`;
}

// Formats a date object or timestamp string to a readable format
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export { getStarsHTML, createErrorMessage, createLoadingIndicator, formatDate };