const scoreSnapshotService = require('../services/scoreSnapshot.service');
const { sendSuccess } = require('../utils/responseHandler');

const getScoreSnapshotsByTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const result = await scoreSnapshotService.getScoreSnapshotsByTrip(tripId, page, limit);
    return sendSuccess(res, result.snapshots, 'Score history snapshots retrieved for trip', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getScoreSnapshotsByTrip,
};
