const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db, registerUser, authenticateUser, getAllUsers, deleteUser } = require('../db/db');

// ADMIN MIDDLEWARE

// Add authorization middleware for admin API routes
const adminAuthMiddleware = (req, res, next) => {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401)
            .set('WWW-Authenticate', 'Basic realm="Admin Access"')
            .json({ error: 'Unauthorized', message: 'Authentication required' });
    }
    
    try {
        // Get the base64 credentials part (remove "Basic " prefix)
        const base64Credentials = authHeader.split(' ')[1];
        // Decode from base64
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        // Split into username:password
        const [username, password] = credentials.split(':');
        
        if (!username || !password) {
            return res.status(401)
                .set('WWW-Authenticate', 'Basic realm="Admin Access"')
                .json({ error: 'Unauthorized', message: 'Invalid credentials format' });
        }
        
        // Special case for hardcoded admin user (for demo purposes)
        if (username === 'admin' && password === 'admin123') {
            req.adminUser = { id: 1, username: 'admin', role: 'admin' };
            return next();
        }
        
        // Regular authentication process
        authenticateUser(username, password, (err, user) => {
            if (err) {
                console.error('Error during admin authentication:', err);
                return res.status(500).send('Server error during authentication');
            }
            
            if (!user) {
                return res.status(401)
                    .set('WWW-Authenticate', 'Basic realm="Admin Access"')
                    .json({ error: 'Unauthorized', message: 'Invalid credentials' });
            }
            
            if (user.role !== 'admin') {
                return res.status(403).json({ 
                    error: 'Forbidden',
                    message: 'Admin rights required to access this resource' 
                });
            }
            
            // User is authenticated and is an admin
            req.adminUser = user;
            next();
        });
    } catch (error) {
        console.error('Error parsing authorization header:', error);
        res.status(401)
            .set('WWW-Authenticate', 'Basic realm="Admin Access"')
            .json({ error: 'Unauthorized', message: 'Invalid authorization header' });
    }
};

// Route to search books from Google Books API
router.get('/books/search', async (req, res) => {
    const query = req.query.q || 'javascript';
    try {
        // Using the correct endpoint for the Google Books API
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
        const books = response.data.items.map(item => ({
            id: item.id,
            title: item.volumeInfo.title,
            author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown',
            thumbnail: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : null,
            description: item.volumeInfo.description || 'No description available'
        }));
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).send('Error fetching books');
    }
});

// Route to get book details
router.get('/books/:id', async (req, res) => {
    const bookId = req.params.id;
    try {
        // Using the correct endpoint for the Google Books API
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
        const book = {
            id: response.data.id,
            title: response.data.volumeInfo.title,
            author: response.data.volumeInfo.authors ? response.data.volumeInfo.authors.join(', ') : 'Unknown',
            thumbnail: response.data.volumeInfo.imageLinks ? response.data.volumeInfo.imageLinks.thumbnail : null,
            description: response.data.volumeInfo.description || 'No description available'
        };
        res.json(book);
    } catch (error) {
        console.error('Error fetching book details:', error);
        res.status(500).send('Error fetching book details');
    }
});

// Route for user login using HTTP Authentication
router.post('/login', (req, res) => {
    // Check if we have Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        // No authorization header, request authentication
        res.status(401)
            .set('WWW-Authenticate', 'Basic realm="BookNerds Login"')
            .json({ message: 'Authentication required' });
        return;
    }
    
    // Parse Authorization header
    try {
        // Get the base64 credentials part (remove "Basic " prefix)
        const base64Credentials = authHeader.split(' ')[1];
        // Decode from base64
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        // Split into username:password
        const [username, password] = credentials.split(':');
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Invalid credentials format' });
        }
        
        // Authenticate the user
        authenticateUser(username, password, (err, user) => {
            if (err) {
                console.error('Error during login:', err);
                return res.status(500).send('Server error during login');
            }
            if (!user) {
                return res.status(401)
                    .set('WWW-Authenticate', 'Basic realm="BookNerds Login"')
                    .json({ message: 'Invalid credentials' });
            }
            
            // Authentication successful
            res.status(200).json({ 
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        });
    } catch (error) {
        console.error('Error parsing authorization header:', error);
        res.status(401).json({ message: 'Invalid authorization header' });
    }
});

// Route for user registration
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }
    
    registerUser(username, password, 'guest', function(err) {
        if (err) {
            // Check for duplicate username error
            if (err.message && err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'Username already exists' });
            }
            
            console.error('Error registering user:', err);
            return res.status(500).send('Error registering user');
        }
        
        // Return user data with role for the client
        db.get('SELECT id, username, role FROM users WHERE username = ?', [username], (err, user) => {
            if (err) {
                console.error('Error fetching user after registration:', err);
                res.status(500).send('Error fetching user data');
            } else {
                res.status(201).json({
                    message: 'User registered successfully',
                    user: user
                });
            }
        });
    });
});

// Route to fetch all reviews
router.get('/reviews', (req, res) => {
    const query = `
        SELECT reviews.id, users.username, reviews.bookTitle, reviews.bookId, reviews.reviewText, reviews.rating, reviews.recommended, reviews.timestamp 
        FROM reviews JOIN users ON reviews.userId = users.id
        ORDER BY reviews.timestamp DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            res.status(500).send('Error fetching reviews');
        } else {
            res.json(rows);
        }
    });
});

// Route to fetch reviews for a specific book
router.get('/reviews/book/:bookId', (req, res) => {
    const bookId = req.params.bookId;
    const query = `
        SELECT reviews.id, users.username, reviews.bookTitle, reviews.reviewText, reviews.rating, reviews.recommended, reviews.timestamp
        FROM reviews JOIN users ON reviews.userId = users.id
        WHERE reviews.bookId = ?
        ORDER BY reviews.timestamp DESC
    `;
    db.all(query, [bookId], (err, rows) => {
        if (err) {
            console.error('Error fetching book reviews:', err);
            res.status(500).send('Error fetching book reviews');
        } else {
            res.json(rows);
        }
    });
});

// Route to fetch reviews by a specific user
router.get('/reviews/user/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT reviews.id, reviews.bookTitle, reviews.bookId, reviews.reviewText, reviews.rating, reviews.recommended, reviews.timestamp
        FROM reviews
        WHERE reviews.userId = ?
        ORDER BY reviews.timestamp DESC
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching user reviews:', err);
            res.status(500).send('Error fetching user reviews');
        } else {
            res.json(rows);
        }
    });
});

// Route to add a review
router.post('/reviews', (req, res) => {
    const { userId, bookId, bookTitle, reviewText, rating, recommended } = req.body;
    if (!userId || !bookId || !bookTitle || !reviewText || !rating) {
        return res.status(400).send('All fields are required');
    }
    const query = `INSERT INTO reviews (userId, bookId, bookTitle, reviewText, rating, recommended) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [userId, bookId, bookTitle, reviewText, rating, recommended ? 1 : 0], function(err) {
        if (err) {
            console.error('Error adding review:', err);
            res.status(500).send('Error adding review');
        } else {
            res.status(201).json({
                message: 'Review added successfully',
                reviewId: this.lastID
            });
        }
    });
});

// Route to delete a review (admin only)
router.delete('/reviews/:id', adminAuthMiddleware, (req, res) => {
    const reviewId = req.params.id;
    const query = `DELETE FROM reviews WHERE id = ?`;
    db.run(query, [reviewId], (err) => {
        if (err) {
            console.error('Error deleting review:', err);
            res.status(500).send('Error deleting review');
        } else {
            res.status(200).send('Review deleted successfully');
        }
    });
});

// Route to get top rated books (based on user reviews in our system)
router.get('/books/top-rated', (req, res) => {
    const query = `
        SELECT r.bookId, r.bookTitle, AVG(r.rating) as avgRating, COUNT(*) as reviewCount
        FROM reviews r
        GROUP BY r.bookId
        HAVING COUNT(*) >= 1
        ORDER BY avgRating DESC, reviewCount DESC
        LIMIT 10
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching top rated books:', err);
            return res.status(500).send('Error fetching top rated books');
        }
        
        // If no reviews exist yet, return an empty array instead of failing
        if (rows.length === 0) {
            return res.json([]);
        }
        
        try {
            // Process each book to create the required format
            const books = rows.map(book => ({
                id: book.bookId,
                title: book.bookTitle,
                author: "Unknown", // Default value
                thumbnail: null,
                avgRating: parseFloat(book.avgRating) || 0,
                reviewCount: parseInt(book.reviewCount) || 0
            }));
            
            res.json(books);
        } catch (error) {
            console.error('Error processing top rated books:', error);
            res.status(500).send('Error processing top rated books data');
        }
    });
});

// Route to get most recommended books (based on user reviews in our system)
router.get('/books/most-recommended', (req, res) => {
    const query = `
        SELECT bookId, bookTitle, SUM(recommended) as recommendCount, COUNT(*) as reviewCount
        FROM reviews
        GROUP BY bookId
        HAVING COUNT(*) >= 1
        ORDER BY (CAST(recommendCount AS FLOAT) / reviewCount) DESC, reviewCount DESC
        LIMIT 10
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching most recommended books:', err);
            return res.status(500).send('Error fetching most recommended books');
        }
        
        // If no reviews exist yet, return an empty array instead of failing
        if (rows.length === 0) {
            return res.json([]);
        }
        
        try {
            // Process book data to add recommendation percentages
            const books = rows.map(book => {
                const recommendCount = parseInt(book.recommendCount || 0);
                const reviewCount = parseInt(book.reviewCount || 0);
                const recommendPercent = reviewCount > 0 ? Math.round((recommendCount / reviewCount) * 100) : 0;
                
                return {
                    id: book.bookId,
                    title: book.bookTitle,
                    author: "Unknown", // Default value
                    thumbnail: null,
                    recommendCount: recommendCount,
                    reviewCount: reviewCount,
                    recommendPercent: recommendPercent
                };
            });
            
            res.json(books);
        } catch (error) {
            console.error('Error processing recommended books:', error);
            res.status(500).send('Error processing recommended books data');
        }
    });
});

// Route to get all users (admin only)
router.get('/admin/users', adminAuthMiddleware, (req, res) => {
    getAllUsers((err, users) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).send('Error fetching users');
        }
        res.json(users);
    });
});

// Route to delete a user (admin only)
router.delete('/admin/users/:id', adminAuthMiddleware, (req, res) => {
    const userId = req.params.id;
    // Prevent deleting the admin user
    if (userId == 1) {
        return res.status(403).send('Cannot delete the admin user');
    }
    
    deleteUser(userId, (err) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).send('Error deleting user');
        }
        res.status(200).send('User deleted successfully');
    });
});

// Route to fetch all reviews for admin panel (admin only)
router.get('/admin/reviews', adminAuthMiddleware, (req, res) => {
    const query = `
        SELECT reviews.id, users.username, reviews.bookTitle, reviews.bookId, reviews.reviewText, reviews.rating, reviews.recommended, reviews.timestamp 
        FROM reviews JOIN users ON reviews.userId = users.id
        ORDER BY reviews.timestamp DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching reviews for admin:', err);
            res.status(500).send('Error fetching reviews');
        } else {
            res.json(rows);
        }
    });
});

// Check if user is admin
router.get('/admin/check', (req, res) => {
    // This endpoint would normally verify a token from an auth system
    // For this simple app, we'll just check against a user ID in the query
    const userId = req.query.userId;
    
    if (!userId) {
        return res.status(401).json({ isAdmin: false, message: 'User ID is required' });
    }
    
    db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Error checking admin status:', err);
            return res.status(500).send('Server error');
        }
        
        if (!user) {
            return res.status(404).json({ isAdmin: false, message: 'User not found' });
        }
        
        const isAdmin = user.role === 'admin';
        res.json({
            isAdmin: isAdmin,
            message: isAdmin ? 'User is an admin' : 'User is not an admin'
        });
    });
});

module.exports = router;