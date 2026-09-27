const CompanySettings = require('../models/CompanySettings');
const { isValidCoordinate } = require('../utils/geoUtils');
const { successResponse, errorResponse } = require('../utils/response');
const { ERROR_CODES } = require('../constants/errors');

/**
 * GET /api/settings/geofence
 * Returns company geofence configuration (accessible to authenticated users).
 */
const getGeofenceSettings = async (req, res, next) => {
  try {
    const settings = await CompanySettings.getSettings();
    return successResponse(res, { settings }, 'Geofence settings retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/settings/geofence
 * Updates company geofence configuration (Admin only).
 */
const updateGeofenceSettings = async (req, res, next) => {
  try {
    const { officeName, geofenceEnabled, latitude, longitude, radiusMeters } = req.body;

    // Validate numeric coordinates
    const latNum = Number(latitude);
    const lonNum = Number(longitude);
    const radNum = Number(radiusMeters);

    if (!isValidCoordinate(latNum, lonNum)) {
      return errorResponse(
        res,
        'Invalid latitude or longitude values',
        400,
        ERROR_CODES.INVALID_LOCATION
      );
    }

    if (isNaN(radNum) || radNum < 10 || radNum > 50000) {
      return errorResponse(
        res,
        'Allowed radius must be between 10m and 50,000m',
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    let settings = await CompanySettings.findOne({});
    if (!settings) {
      settings = new CompanySettings();
    }

    if (officeName !== undefined) settings.officeName = officeName.trim();
    if (geofenceEnabled !== undefined) settings.geofenceEnabled = Boolean(geofenceEnabled);
    settings.latitude = latNum;
    settings.longitude = lonNum;
    settings.radiusMeters = radNum;

    await settings.save();

    return successResponse(res, { settings }, 'Geofence settings updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGeofenceSettings,
  updateGeofenceSettings,
};
