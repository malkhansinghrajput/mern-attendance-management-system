const { cloudinary } = require('../config/cloudinary');
const logger = require('../config/logger');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Uploads a selfie buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The image buffer
 * @param {string} mimeType - MIME type of the image
 * @param {string} userId - Used for folder organization
 * @returns {string} secure_url of uploaded image
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

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `attendance-selfies/${userId}`,
        resource_type: 'image',
        transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload error: ${error.message}`);
          const err = new Error('Image upload failed. Please try again.');
          err.status = 500;
          err.code = 'UPLOAD_FAILED';
          return reject(err);
        }
        logger.info(`Selfie uploaded: userId=${userId}, url=${result.secure_url}`);
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadSelfie };
