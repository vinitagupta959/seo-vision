exports.errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error stack for debugging
  console.error('ERROR 💥:', err);

  if (res.headersSent) {
    return next(err);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'fail',
      message: `Invalid ${err.path}: ${err.value}.`
    });
  }

  // Handle Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const value = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({
      status: 'fail',
      message: `Duplicate field value: '${value}'. Please use another value!`
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    return res.status(400).json({
      status: 'fail',
      message: `Invalid input data: ${errors.join('. ')}`
    });
  }

  // Handle JWT Validation Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again!'
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Your session has expired. Please log in again!'
    });
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Something went wrong on the server.'
  });
};
