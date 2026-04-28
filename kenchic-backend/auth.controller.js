const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt.utils');
const { sendSuccess, sendError } = require('../utils/response.utils');

const VALID_ROLES = ['customer', 'farmer', 'employee'];

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return sendError(res, 'All fields are required: name, email, password, role');
    }

    if (!VALID_ROLES.includes(role)) {
      return sendError(res, `Role must be one of: ${VALID_ROLES.join(', ')}`);
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return sendError(res, 'An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await User.create({ name, email, password: hashedPassword, role });

    const token = generateToken({ id: userId, email, role });

    return sendSuccess(res, { token, user: { id: userId, name, email, role } }, 'Account created successfully', 201);
  } catch (err) {
    console.error('Register error:', err);
    return sendError(res, 'Registration failed. Please try again.', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required');
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return sendSuccess(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return sendError(res, 'Login failed. Please try again.', 500);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user);
  } catch (err) {
    return sendError(res, 'Failed to fetch user', 500);
  }
};

module.exports = { register, login, getMe };