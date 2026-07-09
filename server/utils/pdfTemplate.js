const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

exports.generatePdfHtml = (analysis, report) => {
  const data = report.reportData;
  const displayUrl = analysis.url.replace(/^https?:\/\//i, '');
  const dateStr = formatDate(analysis.startedAt);

  // Recommendations sorted by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedRecs = [...(report.recommendations || [])].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Build Recommendations rows
  const recsHtml = sortedRecs.length === 0
    ? `<tr><td colspan="4" class="no-recs">✓ Excellent work! No issues found. Your website is optimized.</td></tr>`
    : sortedRecs.map(rec => `
      <tr class="rec-row priority-${rec.priority}">
        <td class="col-priority">
          <span class="badge-priority badge-${rec.priority}">${rec.priority.toUpperCase()}</span>
        </td>
        <td class="col-title"><strong>${rec.title}</strong></td>
        <td class="col-desc">${rec.description}</td>
        <td class="col-fix">${rec.fix}</td>
      </tr>
    `).join('');

  // Helper for score colours
  const getScoreClass = (score) => {
    if (score >= 90) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-poor';
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SEO Audit Report for ${displayUrl}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      background-color: #ffffff;
      padding: 40px;
    }
    
    /* Cover Page / Header Panel */
    .report-header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 25px;
      margin-bottom: 35px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .brand-icon {
      font-size: 28px;
      color: #4f46e5;
    }
    
    .brand-name {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    
    .meta-details {
      text-align: right;
    }
    
    .meta-url {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      word-break: break-all;
    }
    
    .meta-date {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    
    /* Overall Score Banner */
    .overall-banner {
      background: linear-gradient(135deg, #4f46e5, #0ea5e9);
      border-radius: 16px;
      padding: 30px;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 35px;
      box-shadow: 0 4px 20px rgba(79, 70, 229, 0.15);
    }
    
    .overall-text h1 {
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 6px;
    }
    
    .overall-text p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .overall-score-badge {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      width: 90px;
      height: 90px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-weight: 800;
    }
    
    .overall-score-val {
      font-size: 32px;
      line-height: 1;
    }
    
    .overall-score-lbl {
      font-size: 10px;
      text-transform: uppercase;
      margin-top: 2px;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }
    
    /* Section Headings */
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      border-left: 4px solid #4f46e5;
      padding-left: 10px;
      margin-bottom: 20px;
      margin-top: 35px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Category Table Grid */
    .score-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 35px;
    }
    
    .score-table th, .score-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .score-table th {
      background-color: #f8fafc;
      color: #475569;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    
    .score-table td {
      font-size: 14px;
    }
    
    .score-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
    }
    
    .score-good { background-color: #d1fae5; color: #065f46; }
    .score-average { background-color: #fef3c7; color: #92400e; }
    .score-poor { background-color: #fee2e2; color: #991b1b; }
    
    /* Metrics Flexbox layouts */
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 35px;
    }
    
    .metric-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      background-color: #f8fafc;
    }
    
    .metric-title {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    
    .metric-value {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    
    .metric-status {
      margin-top: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    
    /* Recommendations Table */
    .recs-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    
    .recs-table th, .recs-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      font-size: 13px;
    }
    
    .recs-table th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
    }
    
    .rec-row:nth-child(even) {
      background-color: #f8fafc;
    }
    
    .col-priority { width: 10%; }
    .col-title { width: 25%; }
    .col-desc { width: 35%; }
    .col-fix { width: 30%; }
    
    .badge-priority {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 11px;
      text-align: center;
    }
    
    .badge-high { background-color: #fee2e2; color: #b91c1c; }
    .badge-medium { background-color: #fef3c7; color: #d97706; }
    .badge-low { background-color: #e0f2fe; color: #0369a1; }
    
    .no-recs {
      text-align: center;
      font-size: 14px;
      color: #059669;
      font-weight: 600;
      padding: 30px;
    }
    
    /* Page Break and Footer */
    .page-break {
      page-break-before: always;
    }
    
    .report-footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 50px;
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
    }
    
    .footer-brand {
      font-weight: 700;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: EXEC SUMMARY & SCORES -->
  <div class="report-header">
    <div class="brand-logo">
      <span class="brand-icon">👁</span>
      <span class="brand-name">SEO Vision</span>
    </div>
    <div class="meta-details">
      <div class="meta-url">${displayUrl}</div>
      <div class="meta-date">Generated on ${dateStr}</div>
    </div>
  </div>

  <div class="overall-banner">
    <div class="overall-text">
      <h1>Website Audit Report</h1>
      <p>A comprehensive SEO performance analysis. Review the scores and critical actions below.</p>
    </div>
    <div class="overall-score-badge">
      <span class="overall-score-val">${report.seoScore}</span>
      <span class="overall-score-lbl">SEO Score</span>
    </div>
  </div>

  <h2 class="section-title">Audit Score Summary</h2>
  <table class="score-table">
    <thead>
      <tr>
        <th>Category Scope</th>
        <th>Score</th>
        <th>Ranking Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Basic SEO & Metadata</td>
        <td><strong>${report.basicSeoScore}/100</strong></td>
        <td><span class="score-badge ${getScoreClass(report.basicSeoScore)}">${report.basicSeoScore >= 90 ? 'Optimized' : report.basicSeoScore >= 50 ? 'Needs Attention' : 'Critical'}</span></td>
      </tr>
      <tr>
        <td>Technical Scopes & SSL</td>
        <td><strong>${report.technicalScore}/100</strong></td>
        <td><span class="score-badge ${getScoreClass(report.technicalScore)}">${report.technicalScore >= 90 ? 'Optimized' : report.technicalScore >= 50 ? 'Needs Attention' : 'Critical'}</span></td>
      </tr>
      <tr>
        <td>Performance & Connection Timings</td>
        <td><strong>${report.performanceScore}/100</strong></td>
        <td><span class="score-badge ${getScoreClass(report.performanceScore)}">${report.performanceScore >= 90 ? 'Optimized' : report.performanceScore >= 50 ? 'Needs Attention' : 'Critical'}</span></td>
      </tr>
      <tr>
        <td>Content & Keyword Density</td>
        <td><strong>${report.contentScore}/100</strong></td>
        <td><span class="score-badge ${getScoreClass(report.contentScore)}">${report.contentScore >= 90 ? 'Optimized' : report.contentScore >= 50 ? 'Needs Attention' : 'Critical'}</span></td>
      </tr>
      <tr>
        <td>Image Alt Optimization</td>
        <td><strong>${report.imagesScore}/100</strong></td>
        <td><span class="score-badge ${getScoreClass(report.imagesScore)}">${report.imagesScore >= 90 ? 'Optimized' : report.imagesScore >= 50 ? 'Needs Attention' : 'Critical'}</span></td>
      </tr>
      <tr>
        <td>Link Indices & Broken Anchor Audits</td>
        <td><strong>${report.linksScore}/100</strong></td>
        <td><span class="score-badge ${getScoreClass(report.linksScore)}">${report.linksScore >= 90 ? 'Optimized' : report.linksScore >= 50 ? 'Needs Attention' : 'Critical'}</span></td>
      </tr>
      <tr>
        <td>Semantic Structured Data</td>
        <td><strong>${report.structuredDataScore}/100</strong></td>
        <td><span class="score-badge ${getScoreClass(report.structuredDataScore)}">${report.structuredDataScore >= 90 ? 'Optimized' : report.structuredDataScore >= 50 ? 'Needs Attention' : 'Critical'}</span></td>
      </tr>
    </tbody>
  </table>

  <h2 class="section-title">Core Performance Metrics</h2>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-title">Page Load Time</div>
      <div class="metric-value">${(data.performance.loadTimeMs / 1000).toFixed(2)} seconds</div>
      <div class="metric-status" style="color: ${data.performance.loadTimeMs < 1500 ? '#059669' : data.performance.loadTimeMs < 3000 ? '#d97706' : '#dc2626'}">
        ${data.performance.loadTimeMs < 1500 ? 'Fast' : data.performance.loadTimeMs < 3000 ? 'Moderate' : 'Slow'}
      </div>
    </div>
    <div class="metric-card">
      <div class="metric-title">DOM Node Complexity</div>
      <div class="metric-value">${data.performance.domSize} nodes</div>
      <div class="metric-status" style="color: ${data.performance.domSize < 1500 ? '#059669' : '#dc2626'}">
        ${data.performance.domSize < 1500 ? 'Good' : 'Excessive'}
      </div>
    </div>
    <div class="metric-card">
      <div class="metric-title">Security & Encryption</div>
      <div class="metric-value">HTTPS / SSL Certification</div>
      <div class="metric-status" style="color: ${data.technical.httpsEnabled && data.technical.sslValid ? '#059669' : '#dc2626'}">
        ${data.technical.httpsEnabled && data.technical.sslValid ? '✓ Fully Secured' : '✗ Security Vulnerabilities'}
      </div>
    </div>
    <div class="metric-card">
      <div class="metric-title">Robots & Crawl Settings</div>
      <div class="metric-value">Robots.txt & Sitemap Files</div>
      <div class="metric-status" style="color: ${data.technical.hasRobots && data.technical.hasSitemap ? '#059669' : '#d97706'}">
        ${data.technical.hasRobots && data.technical.hasSitemap ? '✓ Both Configured' : '✗ Missing Sitemap or Robots'}
      </div>
    </div>
  </div>

  <div class="report-footer">
    <div class="footer-brand">SEO Vision Platform</div>
    <div>Page 1 of 2</div>
  </div>

  <!-- PAGE 2: ACTIONS & CRITICAL FIXES -->
  <div class="page-break"></div>

  <div class="report-header">
    <div class="brand-logo">
      <span class="brand-icon">👁</span>
      <span class="brand-name">SEO Vision</span>
    </div>
    <div class="meta-details">
      <div class="meta-url">${displayUrl}</div>
      <div class="meta-date">Generated on ${dateStr}</div>
    </div>
  </div>

  <h2 class="section-title">Critical Recommendations & Actions</h2>
  <p style="font-size: 13px; color: #475569; margin-bottom: 20px;">
    Follow the action items ordered by priority below to fix critical bugs, improve search indexability, and boost page speeds.
  </p>

  <table class="recs-table">
    <thead>
      <tr>
        <th class="col-priority">Priority</th>
        <th class="col-title">Audit Target</th>
        <th class="col-desc">Finding / Diagnosis</th>
        <th class="col-fix">Suggested Action Fix</th>
      </tr>
    </thead>
    <tbody>
      ${recsHtml}
    </tbody>
  </table>

  <div class="report-footer" style="margin-top: auto;">
    <div class="footer-brand">Generated by SEO Vision</div>
    <div>Page 2 of 2</div>
  </div>

</body>
</html>
  `;
};
