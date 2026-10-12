const mongoose = require('mongoose');

const RiskEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: [true, 'eventId is required'],
      unique: true,
      index: true,
      trim: true,
    },
    tripId: {
      type: String,
      required: [true, 'tripId is required'],
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
    type: {
      type: String,
      required: [true, 'type is required'],
      enum: ['DROWSINESS', 'YAWNING', 'PHONE', 'DISTRACTION'],
    },
    severity: {
      type: String,
      required: [true, 'severity is required'],
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    pointsDeducted: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    latitude: {
      type: Number,
      required: [true, 'latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'longitude is required'],
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast trip and driver event queries
RiskEventSchema.index({ tripId: 1, timestamp: -1 });
RiskEventSchema.index({ driverId: 1, timestamp: -1 });
RiskEventSchema.index({ managerId: 1, timestamp: -1 });

module.exports = mongoose.model('RiskEvent', RiskEventSchema);
