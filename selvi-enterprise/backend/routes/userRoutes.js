const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

const {
  getAllUsers,
  getUser,
  deleteUser,
  getFrequentBuyers,
  getCustomers
} = require('../controllers/userController');

// All routes are admin only
router.use(protect, adminOnly);

router.get('/', getAllUsers);
router.get('/customers', getCustomers);
router.get('/frequent-buyers', getFrequentBuyers);
router.get('/:id', getUser);
router.delete('/:id', deleteUser);

module.exports = router;
