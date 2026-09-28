const ScoreSnapshot = require('../models/ScoreSnapshot');
const mongoose = require('mongoose');

const inMemoryScoreSnapshots = [];

/**
 * ScoreSnapshot Service - Hybrid Dual-Mode Persistence (MongoDB + Fallback)
 */
const recordSnapshot = async (snapshotData) => {
  if (mongoose.connection.readyState === 1) {
    return await ScoreSnapshot.create(snapshotData);
  }

  const snapshotObj = {
    tripId: snapshotData.tripId,
    score: snapshotData.score,
    timestamp: snapshotData.timestamp || new Date(),
    reason: snapshotData.reason,
    createdAt: new Date(),
  };

  inMemoryScoreSnapshots.push(snapshotObj);
  return snapshotObj;
};

const getScoreSnapshotsByTrip = async (tripId, page = 1, limit = 50) => {
  if (mongoose.connection.readyState === 1) {
    const skip = (page - 1) * limit;
    const [snapshots, total] = await Promise.all([
      ScoreSnapshot.find({ tripId }).sort({ timestamp: 1 }).skip(skip).limit(limit),
      ScoreSnapshot.countDocuments({ tripId }),
    ]);

    return {
      snapshots,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const filtered = inMemoryScoreSnapshots.filter((s) => s.tripId === tripId);
  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  return {
    snapshots: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

module.exports = {
  recordSnapshot,
  getScoreSnapshotsByTrip,
};
