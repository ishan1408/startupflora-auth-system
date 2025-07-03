const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getSessions,
  logoutSession,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { extractUser } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/accessControl');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/users', extractUser, checkPermission('viewAllUsers'), getAllUsers);        
router.get('/users/:id', extractUser, checkPermission('view_user'), getUserById);  
router.patch('/users/:id', extractUser, checkPermission('edit_user'), updateUser);  
router.delete('/users/:id', extractUser, checkPermission('deleteUser'), deleteUser);

router.get('/sessions', extractUser, getSessions);
router.delete('/sessions/:sessionId', extractUser, logoutSession);

module.exports = router;
