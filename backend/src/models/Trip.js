const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const TripSchema = new mongoose.Schema(
  {
    tripId: {
      type: String,
      required: [true, 'tripId is required'],
      unique: true,
      index: true,
      trim: true,
    },
    driverId: {
      type: String,
      required: [true, 'driverId is required'],
      index: true,
      trim: true,
    },
    managerId: {
      type: String,
      index: true,
      trim: true,
      default: null,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    startingLocation: {
      type: LocationSchema,
      required: [true, 'startingLocation is required'],
    },
    endingLocation: {
      type: LocationSchema,
      default: null,
    },
    finalScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    totalAlerts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for driver trips lookup sorted by startTime
TripSchema.index({ driverId: 1, startTime: -1 });
TripSchema.index({ managerId: 1, startTime: -1 });

module.exports = mongoose.model('Trip', TripSchema);
