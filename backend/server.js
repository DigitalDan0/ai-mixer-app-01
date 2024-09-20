const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/dbConfig');
const trackRoutes = require('./routes/trackRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { notFound, handleError } = require('./utils/errorHandler');
const { logInfo } = require('./utils/logger');

// Initialize Express app
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Connect to database
connectDB();

// Route definitions
app.use('/api/tracks', trackRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use(notFound);
app.use(handleError);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logInfo(`Server running on port ${PORT}`);
});

module.exports = app;