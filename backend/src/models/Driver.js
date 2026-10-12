const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: [true, 'driverId is required'],
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'password is required'],
      default: 'driver123',
    },
    managerId: {
      type: String,
      required: [true, 'managerId is required'],
      index: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['DRIVER'],
      default: 'DRIVER',
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: null,
    },
    safetyRating: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ON_TRIP', 'SUSPENDED', 'OFF_DUTY'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying drivers belonging to a specific manager
DriverSchema.index({ managerId: 1, createdAt: -1 });

module.exports = mongoose.model('Driver', DriverSchema);
