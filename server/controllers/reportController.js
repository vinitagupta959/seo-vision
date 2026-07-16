const Report = require('../models/Report.js');
const Analysis = require('../models/Analysis.js');
const { AppError } = require('../utils/errors.js');
const puppeteer = require('puppeteer');
const { generatePdfHtml } = require('../utils/pdfTemplate.js');

// Fetch raw report JSON
exports.getReport = async (req, res, next) => {
  try {
    let report = await Report.findById(req.params.id);
    if (!report) {
      report = await Report.findOne({ analysisId: req.params.id });
    }
    if (!report) {
      return next(new AppError('No report found with that ID.', 404));
    }
    
    // Verify ownership
    const analysis = await Analysis.findById(report.analysisId);
    if (!analysis || analysis.userId.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to view this report.', 403));
    }

    res.status(200).json({
      status: 'success',
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
};

// Exporter: renders layout and compiles to PDF via Puppeteer
exports.downloadReportPdf = async (req, res, next) => {
  let browser;
  try {
    let analysis = await Analysis.findById(req.params.id).populate('reportId');
    if (!analysis) {
      analysis = await Analysis.findOne({ reportId: req.params.id }).populate('reportId');
    }
    if (!analysis) {
      return next(new AppError('No analysis report found with that ID.', 404));
    }

    // Verify ownership
    if (analysis.userId.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to download this report.', 403));
    }

    if (!analysis.reportId) {
      return next(new AppError('No audit report data found for this analysis.', 404));
    }

    // Generate static print-friendly HTML
    const htmlContent = generatePdfHtml(analysis, analysis.reportId);

    browser = await puppeteer.launch({
      headless: 'shell',
      pipe: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Load pre-rendered static content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF binary buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    });

    await browser.close();
    browser = null;

    // Send PDF stream to download
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SEO-Vision-Report-${analysis._id}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        // ignore
      }
    }
    console.error('PDF Generation Error:', error);
    next(new AppError(`Failed to generate report PDF: ${error.message}`, 500));
  }
};
