const express = require('express');
const router = express.Router();
const { isHRorAdmin } = require('../middlewares/auth');
const {
  getPendingUsers,
  approveUser,
  rejectUser,
} = require('../controllers/hrController');

router.get('/pending-users', isHRorAdmin,getPendingUsers);
router.patch('/approve/:userId', isHRorAdmin, approveUser);
router.patch('/reject/:userId', isHRorAdmin, rejectUser);

module.exports = router;
