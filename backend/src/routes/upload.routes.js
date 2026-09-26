const express = require('express');
const router = express.Router();
const { upload, uploadSelfieHandler } = require('../controllers/upload.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');

// Only employees can upload selfies (during punch in/out)
router.post('/selfie', authenticate, authorize('employee'), upload.single('file'), uploadSelfieHandler);

module.exports = router;
