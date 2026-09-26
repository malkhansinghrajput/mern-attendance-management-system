const multer = require('multer');
const { uploadSelfie } = require('../services/upload.service');
const { sendSuccess, sendError } = require('../utils/response');

// Store in memory — we stream to Cloudinary without touching disk
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
  },
});

const uploadSelfieHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'SELFIE_REQUIRED', 'Selfie image is required');
    }

    const url = await uploadSelfie(req.file.buffer, req.file.mimetype, req.user._id.toString());
    return sendSuccess(res, 200, 'Selfie uploaded successfully', { url });
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, uploadSelfieHandler };
