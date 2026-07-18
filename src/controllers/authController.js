const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Base = require('../models/Base');
const { logTransaction } = require('../middleware/logger');

const login = async (req, res) => {
  try {
    const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password ? req.body.password : '';
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).populate('baseId');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, baseId: user.baseId ? user.baseId._id : null },
      process.env.JWT_SECRET || 'supersecretjwtkeyfortestingonly12345',
      { expiresIn: '8h' }
    );

    // Audit log login
    await logTransaction({
      userId: user._id,
      action: 'LOGIN',
      module: 'Auth',
      referenceId: user._id,
      description: `User ${user.email} successfully logged in as role ${user.role}`
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        baseId: user.baseId
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('baseId').select('-passwordHash');
    res.status(200).json(user);
  } catch (err) {
    console.error('getMe error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  getMe
};
