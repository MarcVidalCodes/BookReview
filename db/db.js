const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Database connected at', dbPath);
    }
});

// Initialize database tables without dropping existing data
db.serialize(() => {
    // Create users table if it doesn't exist
    const createUsersTable = `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    );`;
    
    db.run(createUsersTable, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            console.log('Users table created successfully.');
    
            // Insert default admin user if it doesn't exist
            db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
                if (err) {
                    console.error('Error checking for admin user:', err);
                } else if (!row) {
                    // Admin doesn't exist, create it
                    const insertAdminUser = `INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin');`;
                    db.run(insertAdminUser, (err) => {
                        if (err) {
                            console.error('Error inserting admin user:', err);
                        } else {
                            console.log('Default admin user added.');
                            console.log('=====================================');
                            console.log('Admin credentials for testing:');
                            console.log('Username: admin');
                            console.log('Password: admin123');
                            console.log('=====================================');
                        }
                    });
                } else {
                    console.log('Admin user already exists.');
                    console.log('=====================================');
                    console.log('Admin credentials for testing:');
                    console.log('Username: admin');
                    console.log('Password: admin123');
                    console.log('=====================================');
                }
            });
        }
    });
    
    // Create reviews table if it doesn't exist
    const createReviewsTable = `CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        bookId TEXT NOT NULL,
        bookTitle TEXT NOT NULL,
        reviewText TEXT NOT NULL,
        rating INTEGER NOT NULL,
        recommended BOOLEAN NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
    );`;
    
    db.run(createReviewsTable, (err) => {
        if (err) {
            console.error('Error creating reviews table:', err);
        } else {
            console.log('Reviews table created successfully.');
        }
    });
});

// Function to register a new user
function registerUser(username, password, role, callback) {
    const query = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;
    db.run(query, [username, password, role], callback);
}

// Function to authenticate a user
function authenticateUser(username, password, callback) {
    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
    db.get(query, [username, password], callback);
}

// Function to get all users
function getAllUsers(callback) {
    const query = `SELECT id, username, role FROM users`;
    db.all(query, callback);
}

// Function to delete a user
function deleteUser(userId, callback) {
    // First delete all reviews by this user to maintain referential integrity
    db.run(`DELETE FROM reviews WHERE userId = ?`, [userId], (err) => {
        if (err) {
            callback(err);
            return;
        }
        
        // Then delete the user
        db.run(`DELETE FROM users WHERE id = ?`, [userId], callback);
    });
}

module.exports = { 
    db, 
    registerUser, 
    authenticateUser,
    getAllUsers,
    deleteUser
};