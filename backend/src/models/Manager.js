const mongoose = require('mongoose');

const ManagerSchema = new mongoose.Schema(
  {
    managerId: {
      type: String,
      required: [true, 'managerId is required'],
      unique: true,
      index: true,
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'username is required'],
      unique: true,
      index: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'password is required'],
    },
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: ['MANAGER'],
      default: 'MANAGER',
    },
    department: {
      type: String,
      trim: true,
      default: 'Fleet Operations',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Manager', ManagerSchema);
