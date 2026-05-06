const { protect } = require('./auth');

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

const managerOrAdmin = (req, res, next) => {
  if (!['manager', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Manager or admin access required' });
  }
  next();
};

module.exports = { protect, adminOnly, managerOrAdmin };
