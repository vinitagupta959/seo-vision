const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const { AppError } = require('../utils/errors.js');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Retrieve token from authorization headers or query parameters
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to get access.', 401)
      );
    }

    // Verify token payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists in database
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this session no longer exists.', 401)
      );
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    next(error); // Caught by centralized error middleware (JsonWebTokenError, TokenExpiredError)
  }
};
