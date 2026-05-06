const express = require('express');
const router = express.Router();
const { login, register, getManagers, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/managers', getManagers);
router.get('/me', protect, getMe);

module.exports = router;
