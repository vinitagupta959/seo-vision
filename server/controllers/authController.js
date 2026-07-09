const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const { AppError } = require('../utils/errors.js');

// Helper to sign JWT tokens
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Helper to format responses with tokens
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Convert mongoose doc to plain object to delete password field
  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: userObj
    }
  });
};

// REGISTER User
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email, and password.', 400));
    }

    // Default avatar using initials or blank
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const newUser = await User.create({
      name,
      email,
      password,
      avatar
    });

    createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

// LOGIN User
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password.', 400));
    }

    // Explicitly select password
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password.', 401));
    }

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// GET User Profile
exports.getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE User Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password; // Trigger mongoose pre-save hook for password hash

    // Regenerate DiceBear avatar if name changes
    if (name) {
      user.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    }

    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};
