BOOKNERDS - BOOK REVIEW COMMUNITY

Affidavit:
"I attest to be begin the sole author of this submitted work and any code borrowed from other sources has been identified by comments placed in my submitted code.
Marc Vidal, 101301529"

Video Demo:
https://www.youtube.com/watch?v=mHyKQrIPBu4

INSTALL INSTRUCTIONS:
npm install

To ensure download:
npm i Express
npm i Axios
npm i sqlite3
npm i handlebars
npm i express-handlebars

LAUNCH INSTRUCTIONS:
node server.js

TESTING INSTRUCTIONS:
Main website: http://localhost:3000
Search page: http://localhost:3000/search
My Reviews: http://localhost:3000/my-reviews
Admin Dashboard: http://localhost:3000/admin
Book Details Page Example: http://localhost:3000/book/123

1. Use the admin account to test admin features:
   - Username: admin
   - Password: admin123
   
2. Register a new guest account to test guest features:
   - Click on "Register" in the authentication screen
   - Fill in the registration form with a username and password
   
3. Test features:
   - Browse latest reviews on the home page
   - Search for books using the search page
   - View book details by clicking on any book card
   - Write reviews and rate books (1-10) when logged in
   - Recommend or not recommend books in your reviews
   - Admin can manage users and reviews via the Admin page

FEATURES IMPLEMENTED:
1. User Authentication
   - Client-side authentication with localStorage
   - User registration for guest accounts
   - Admin privileges for user and review management

2. Book Data
   - Integration with Google Books API for book information
   - Search functionality with detailed results
   - Detailed book views with descriptions

3. User Contributions
   - Book ratings (1-10 scale)
   - Text reviews
   - Recommendation system (yes/no)
   - My Reviews page to track your contributions

4. Admin Features
   - User management (view and delete users)
   - Review management (view and delete any review)
   - Admin-only access via role-based permission

5. Database
   - SQLite database for storing users and reviews
   - Persistent storage of user contributions

6. Single-Page Application
   - Client-side JavaScript for all interactions
   - Dynamic content updates without page reloads
   - Hash-based navigation

TECHNOLOGIES USED:
- Node.js with Express
- SQLite database
- Google Books API for book data
- Vanilla JavaScript for client-side functionality
- CSS for responsive styling

USEFUL DATABASE COMMANDS:
To access the database directly, open a terminal and run:
> sqlite3 db/database.sqlite

View the schema: 
.schema

Common SQLite commands:
1. View all users:
   > SELECT * FROM users;

2. Add a new user:
   > INSERT INTO users (username, password, role) VALUES ('username', 'password', 'guest');

3. Add an admin user:
   > INSERT INTO users (username, password, role) VALUES ('newadmin', 'password', 'admin');

4. Delete a user:
   > DELETE FROM users WHERE id = x; -- Replace x with the actual user ID

5. View all reviews:
   > SELECT reviews.*, users.username FROM reviews JOIN users ON reviews.userId = users.id;

6. View reviews by a specific user:
   > SELECT * FROM reviews WHERE userId = [user_id];

7. View reviews for a specific book:
   > SELECT * FROM reviews WHERE bookId = 'book_id';

8. Delete a review:
   > DELETE FROM reviews WHERE id = [review_id];

9. Exit SQLite:
   > .exit
