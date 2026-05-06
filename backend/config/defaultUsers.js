const { ensureDefaultUsers, snapshot } = require('../data/store');

const DEFAULT_USERS = [
  {
    name: 'System Admin',
    email: 'admin@workpulse.com',
    password: 'admin123',
    role: 'admin',
    department: 'Administration',
  },
  {
    name: 'Shubham Hegishte',
    email: 'shubham@gmail.com',
    password: 'manager123',
    role: 'manager',
    department: 'Engineering',
  },
  {
    name: 'Vinaya Patole',
    email: 'vinaya@gmail.com',
    password: 'manager123',
    role: 'manager',
    department: 'Operations',
  },
  {
    name: 'Rushan Kamble',
    email: 'rushan@gmail.com',
    password: 'manager123',
    role: 'manager',
    department: 'Product',
  },
];

const seedDefaultUsers = async () => {
  ensureDefaultUsers();
  return snapshot().users;
};

module.exports = { ensureDefaultUsers: seedDefaultUsers, DEFAULT_USERS };
