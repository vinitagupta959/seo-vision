const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { errorHandler } = require('./middleware/errorMiddleware.js');
const { AppError } = require('./utils/errors.js');
const { mongoSanitize, xssClean } = require('./middleware/securityMiddleware.js');
const authRoutes = require('./routes/authRoutes.js');
const analyzeRoutes = require('./routes/analyzeRoutes.js');
const reportRoutes = require('./routes/reportRoutes.js');

const app = express();

app.set('trust proxy', 1);

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  message: 'Too many requests from this IP. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

// Base Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disabled temporarily for asset loading
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' })); // Body limit to prevent DOS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply security sanitizations
app.use(mongoSanitize);
app.use(xssClean);

// Apply Rate Limiter on API routes
app.use('/api', apiLimiter);

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/report', reportRoutes);

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SEO Vision API is running smoothly'
  });
});

// Catch all unmatched API routes
app.all('/api/*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Catch all unmatched frontend browser routes and serve 404.html
app.all('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../client/pages/404.html'));
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
