const express = require('express');
const router = express.Router();
const { getAllUsers, getTeamUsers, getUserById, updateUserStatus } = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');

router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/team', authenticate, authorize('manager'), getTeamUsers);
router.get('/:id', authenticate, authorize('admin', 'manager'), getUserById);
router.patch('/:id/status', authenticate, authorize('admin'), updateUserStatus);

module.exports = router;
