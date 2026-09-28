const mongoose = require('mongoose');

const ScoreSnapshotSchema = new mongoose.Schema(
  {
    tripId: {
      type: String,
      required: [true, 'tripId is required'],
      index: true,
      trim: true,
    },
    score: {
      type: Number,
      required: [true, 'score is required'],
      min: 0,
      max: 100,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying score history chronologically per trip
ScoreSnapshotSchema.index({ tripId: 1, timestamp: -1 });

module.exports = mongoose.model('ScoreSnapshot', ScoreSnapshotSchema);
