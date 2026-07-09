const express = require('express');
const {
  createAnalysis,
  getAnalysis,
  getHistory,
  deleteAnalysis
} = require('../controllers/analyzeController.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Apply JWT authentication protection middleware to all analysis routes
router.use(protect);

router.post('/', createAnalysis);
router.get('/history', getHistory);
router.get('/:id', getAnalysis);
router.delete('/:id', deleteAnalysis);

module.exports = router;
