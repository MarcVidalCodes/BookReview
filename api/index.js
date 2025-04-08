// Fixed the routing to correctly handle API requests
const express = require('express');
const router = express.Router();
const apiRoutes = require('./api');

// Use apiRoutes directly instead of nesting under /books
router.use('/', apiRoutes);

module.exports = router;