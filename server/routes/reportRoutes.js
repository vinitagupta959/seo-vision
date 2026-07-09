const express = require('express');
const { getReport, downloadReportPdf } = require('../controllers/reportController.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Apply JWT authentication protection middleware to all report endpoints
router.use(protect);

router.get('/:id', getReport);
router.get('/download/:id', downloadReportPdf);

module.exports = router;
