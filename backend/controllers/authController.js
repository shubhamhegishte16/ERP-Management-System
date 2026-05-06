const jwt = require('jsonwebtoken');
const {
  createUser,
  findUser,
  findUserById,
  listUsers,
  sanitizeUser,
} = require('../data/store');

const generateToken = (id) => jwt.sign(
  { id },
  process.env.JWT_SECRET || 'demo_secret_change_before_real_deployment',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = findUser({ email: String(email).toLowerCase().trim() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ success: false, message: 'Selected role does not match this account' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, role, manager, department, registrationDate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (findUser({ email: normalizedEmail })) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    let selectedManager = null;
    if (manager) {
      selectedManager = findUser({ _id: manager, role: 'manager', isActive: true });
      if (!selectedManager) {
        return res.status(400).json({ success: false, message: 'Please select a valid manager' });
      }
    }

    const user = createUser({
      name,
      email: normalizedEmail,
      password,
      role: role || 'employee',
      manager: selectedManager?._id || null,
      department: department || 'General',
      registrationDate: registrationDate || Date.now(),
      isActive: true,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getManagers = async (req, res) => {
  try {
    const managers = listUsers({ role: 'manager', isActive: true })
      .map(sanitizeUser)
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ success: true, managers });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = findUserById(req.user._id);
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { login, register, getManagers, getMe };
