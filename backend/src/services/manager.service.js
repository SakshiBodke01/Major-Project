const Manager = require('../models/Manager');
const mongoose = require('mongoose');

const inMemoryManagers = new Map([
  [
    'manager',
    {
      managerId: 'MGR-001',
      username: 'manager',
      password: '@manager123',
      name: 'Fleet Operations Manager',
      email: 'manager@fleetops.com',
      role: 'MANAGER',
      department: 'Fleet Operations',
      createdAt: new Date(),
    },
  ],
  [
    'admin',
    {
      managerId: 'MGR-ADMIN',
      username: 'admin',
      password: '@admin123',
      name: 'Central Fleet Admin',
      email: 'admin@fleetops.com',
      role: 'MANAGER',
      department: 'Central Administration',
      createdAt: new Date(),
    },
  ],
]);

const getManagerByUsername = async (username) => {
  if (mongoose.connection.readyState === 1) {
    const doc = await Manager.findOne({ username });
    if (doc) return doc;
  }
  return inMemoryManagers.get(username) || null;
};

const getManagerById = async (managerId) => {
  if (mongoose.connection.readyState === 1) {
    const doc = await Manager.findOne({ managerId });
    if (doc) return doc;
  }
  for (const m of inMemoryManagers.values()) {
    if (m.managerId === managerId) return m;
  }
  return null;
};

const authenticateManager = async (username, password) => {
  const manager = await getManagerByUsername(username);
  if (!manager) return null;
  if (manager.password !== password) return null;
  return manager;
};

module.exports = {
  getManagerByUsername,
  getManagerById,
  authenticateManager,
};
