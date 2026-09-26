const { cloudinary } = require('../config/cloudinary');
const logger = require('../config/logger');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Uploads a selfie buffer to Cloudinary or falls back to Base64 data URI if unconfigured.
 * @param {Buffer} fileBuffer - The image buffer
 * @param {string} mimeType - MIME type of the image
 * @param {string} userId - Used for folder organization
 * @returns {Promise<string>} secure_url or base64 data URI of uploaded image
 */
const uploadSelfie = (fileBuffer, mimeType, userId) => {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(mimeType)) {
      const err = new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
      err.status = 400;
      err.code = 'INVALID_FILE_TYPE';
      return reject(err);
    }

    if (fileBuffer.length > MAX_SIZE_BYTES) {
      const err = new Error('File too large. Maximum size is 5MB');
      err.status = 400;
      err.code = 'FILE_TOO_LARGE';
      return reject(err);
    }

    // Check if Cloudinary is configured with valid real keys
    const isCloudinaryConfigured =
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

    if (!isCloudinaryConfigured) {
      // Return base64 data URI for local development
      const dataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      logger.info(`Selfie stored as data URI: userId=${userId}`);
      return resolve(dataUri);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `attendance-selfies/${userId}`,
        resource_type: 'image',
        transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) {
          logger.warn(`Cloudinary upload warning: ${error.message}. Falling back to Data URI.`);
          const fallbackDataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
          return resolve(fallbackDataUri);
        }
        logger.info(`Selfie uploaded to Cloudinary: userId=${userId}, url=${result.secure_url}`);
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadSelfie };

