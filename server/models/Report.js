const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
    required: true
  },
  seoScore: { type: Number, required: true }, // Overall Score (average of others)
  basicSeoScore: { type: Number, default: 0 },
  technicalScore: { type: Number, required: true },
  performanceScore: { type: Number, required: true },
  contentScore: { type: Number, required: true },
  imagesScore: { type: Number, required: true },
  linksScore: { type: Number, required: true },
  structuredDataScore: { type: Number, required: true },
  recommendations: {
    type: [Object],
    default: []
  },
  reportData: {
    type: Object,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
