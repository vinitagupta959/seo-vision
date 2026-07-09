const validator = require('validator');
const Analysis = require('../models/Analysis.js');
const Report = require('../models/Report.js');
const { crawlUrl } = require('../services/crawlerService.js');
const { auditHtml } = require('../services/auditService.js');
const { calculateScoresAndRecommendations } = require('../services/scoringService.js');
const { AppError } = require('../utils/errors.js');

// Analyze website URL
exports.createAnalysis = async (req, res, next) => {
  let analysis;
  try {
    let { url } = req.body;

    if (!url) {
      return next(new AppError('Please provide a URL to analyze.', 400));
    }

    url = url.trim();

    // Standardize URL formatting
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }

    if (!validator.isURL(url, { require_protocol: true })) {
      return next(new AppError('Please provide a valid URL.', 400));
    }

    // 1. Create temporary Analysis trace in DB
    analysis = await Analysis.create({
      userId: req.user._id,
      url,
      status: 'running',
      startedAt: new Date()
    });

    // 2. Execute scraping and HTML audits
    const crawlResult = await crawlUrl(url);
    const auditResult = await auditHtml(crawlResult.html, crawlResult.url, crawlResult);

    // 3. Compute scores and recommendations
    const evaluation = calculateScoresAndRecommendations(auditResult);

    // 4. Save detailed Report model
    const report = await Report.create({
      analysisId: analysis._id,
      seoScore: evaluation.scores.overallScore,
      basicSeoScore: evaluation.scores.basicSeo,
      technicalScore: evaluation.scores.technicalSeo,
      performanceScore: evaluation.scores.performance,
      contentScore: evaluation.scores.content,
      imagesScore: evaluation.scores.images,
      linksScore: evaluation.scores.links,
      structuredDataScore: evaluation.scores.structuredData,
      recommendations: evaluation.recommendations,
      reportData: auditResult
    });

    // 5. Update parent Analysis document as complete
    analysis.status = 'completed';
    analysis.completedAt = new Date();
    analysis.reportId = report._id;
    await analysis.save();

    res.status(201).json({
      status: 'success',
      data: {
        analysis,
        report
      }
    });

  } catch (error) {
    console.error('Analysis Pipeline Error:', error);

    // Update status to failed in database if analysis document was created
    if (analysis) {
      try {
        analysis.status = 'failed';
        analysis.completedAt = new Date();
        await analysis.save();
      } catch (dbErr) {
        console.error('Failed to update analysis status to failed:', dbErr.message);
      }
    }

    next(new AppError(error.message || 'Analysis pipeline failed.', 400));
  }
};

// Retrieve a single analysis & populated report
exports.getAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('reportId');

    if (!analysis) {
      return next(new AppError('No analysis report found with that ID.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        analysis
      }
    });
  } catch (error) {
    next(error);
  }
};

// Retrieve user's past audits history with searching, sorting, filtering and pagination
exports.getHistory = async (req, res, next) => {
  try {
    const { status, sort, page = 1, limit = 10 } = req.query;
    const searchVal = req.query.keyword || req.query.search;

    const query = { userId: req.user._id };

    // Search filter
    if (searchVal) {
      query.url = { $regex: searchVal, $options: 'i' };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Sorting definition
    let sortBy = { startedAt: -1 }; // Default: newest first
    if (sort === 'oldest') {
      sortBy = { startedAt: 1 };
    }

    // Pagination calculations
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // If sorting by score, we use aggregate pipeline
    let analyses;
    let totalCount;

    if (sort === 'score_desc' || sort === 'score_asc') {
      const sortDirection = sort === 'score_desc' ? -1 : 1;
      
      const aggregatePipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'reports',
            localField: 'reportId',
            foreignField: '_id',
            as: 'report'
          }
        },
        { $unwind: { path: '$report', preserveNullAndEmptyArrays: true } },
        { $sort: { 'report.seoScore': sortDirection, startedAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ];

      analyses = await Analysis.aggregate(aggregatePipeline);
      
      // Aggregate doesn't return Mongoose models, so format output reports appropriately
      analyses = analyses.map(item => {
        if (item.report) {
          item.reportId = item.report;
          delete item.report;
        }
        return item;
      });

      totalCount = await Analysis.countDocuments(query);
    } else {
      analyses = await Analysis.find(query)
        .populate('reportId')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit));

      totalCount = await Analysis.countDocuments(query);
    }

    res.status(200).json({
      status: 'success',
      results: analyses.length,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      totalResults: totalCount,
      data: {
        analyses
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete analysis
exports.deleteAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!analysis) {
      return next(new AppError('No audit found with that ID.', 404));
    }

    // Delete associated report
    if (analysis.reportId) {
      await Report.findByIdAndDelete(analysis.reportId);
    }

    await Analysis.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
