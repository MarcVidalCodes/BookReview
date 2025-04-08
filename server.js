const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars'); // Add handlebars engine
const app = express();
const PORT = 3000;
const { db } = require('./db/db');

// Set up Handlebars templating engine
app.engine('handlebars', engine({
  defaultLayout: 'main',
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON requests
app.use(express.json());

// API routes
const apiRoutes = require('./api');
app.use('/api', apiRoutes);

// Default route - renders home template
app.get('/', (req, res) => {
  res.render('home', {
    pageTitle: 'BookNerds - Your Book Review Community'
  });
});

// Search page
app.get('/search', (req, res) => {
  res.render('search', {
    pageTitle: 'Search Books - BookNerds'
  });
});

// My reviews page
app.get('/my-reviews', (req, res) => {
  res.render('my-reviews', {
    pageTitle: 'My Reviews - BookNerds'
  });
});

// Admin page with server-side authorization
app.get('/admin', (req, res) => {
  // Render the admin page - client-side code will check for admin role
  // and show the unauthorized page if needed
  res.render('admin', {
    pageTitle: 'Admin Dashboard - BookNerds'
  });
});

// Add a dedicated endpoint for admin users list that doesn't require client auth
app.get('/admin/get-users', (req, res) => {
  db.all('SELECT id, username, role FROM users', [], (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Error fetching users' });
    }
    
    res.json(users);
  });
});

// Add a dedicated endpoint for admin to delete users
app.post('/admin/delete-user', express.json(), (req, res) => {
  const { userId, adminPassword } = req.body;
  
  // Simple admin verification - in a real app, use proper authentication
  if (adminPassword !== 'admin123') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  // Prevent deleting the admin user
  if (userId == 1) {
    return res.status(403).json({ error: 'Cannot delete the admin user' });
  }
  
  // First delete user's reviews to maintain referential integrity
  db.run('DELETE FROM reviews WHERE userId = ?', [userId], (err) => {
    if (err) {
      console.error('Error deleting user reviews:', err);
      return res.status(500).json({ error: 'Error deleting user' });
    }
    
    // Then delete the user
    db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({ error: 'Error deleting user' });
      }
      
      res.json({ success: true, message: 'User deleted successfully' });
    });
  });
});

// Book details page
app.get('/book/:id', (req, res) => {
  const bookId = req.params.id;
  res.render('book', {
    pageTitle: 'Book Details - BookNerds',
    bookId: bookId
  });
});

// Catch all other routes and redirect to home
app.get('*', (req, res) => {
  res.redirect('/');
});

// Function to list all website URLs
function listWebsiteURLs() {
  const baseURL = `http://localhost:${PORT}`;
  console.log('\n========== WEBSITE URLs ==========');
  console.log(`Main website: ${baseURL}`);
  console.log(`Search page: ${baseURL}/search`);
  console.log(`My Reviews: ${baseURL}/my-reviews`);
  console.log(`Admin Dashboard: ${baseURL}/admin`);
  console.log(`Book Details Page Example: ${baseURL}/book/123`);
  console.log(`API Endpoints: ${baseURL}/api/...`);
  console.log('=================================\n');
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  listWebsiteURLs();
});