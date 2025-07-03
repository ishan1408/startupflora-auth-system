const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/auth');

const {
  createRole,
  getRoles,
  updateRole,
} = require('../controllers/roleController');


router.post('/', isAdmin, createRole);
router.get('/', getRoles);
router.patch('/:id', isAdmin, updateRole);

module.exports = router;
