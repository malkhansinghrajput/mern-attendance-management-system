const express = require('express');
const router = express.Router();
const { getGeofenceSettings, updateGeofenceSettings } = require('../controllers/settings.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');

// GET /api/settings/geofence — authenticated users
router.get('/geofence', authenticate, getGeofenceSettings);

// PUT /api/settings/geofence — admin only
router.put('/geofence', authenticate, authorize('admin'), updateGeofenceSettings);

module.exports = router;
