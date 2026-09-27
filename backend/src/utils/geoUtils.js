/**
 * Centralized Geolocation Utilities & Haversine Distance Calculator.
 */

const EARTH_RADIUS_METERS = 6371000; // 6,371 km in meters

/**
 * Calculates the geodesic distance in meters between two lat/lng coordinates
 * using the Haversine formula.
 *
 * @param {number} lat1 Latitude of point 1 (in degrees)
 * @param {number} lon1 Longitude of point 1 (in degrees)
 * @param {number} lat2 Latitude of point 2 (in degrees)
 * @param {number} lon2 Longitude of point 2 (in degrees)
 * @returns {number} Distance in meters (rounded to whole meters)
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceMeters = EARTH_RADIUS_METERS * c;
  return Math.round(distanceMeters);
};

/**
 * Validates that latitude and longitude are valid numeric coordinates.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {boolean}
 */
const isValidCoordinate = (lat, lon) => {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (isNaN(lat) || isNaN(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  return true;
};

module.exports = {
  calculateHaversineDistance,
  isValidCoordinate,
};
