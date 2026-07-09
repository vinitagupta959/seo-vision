import { checkAuthAndProtect, getToken } from '../auth.js';
import { showToast } from '../components/toast.js';
import { formatDate } from '../utils.js';
import { API_BASE } from '../api.js';

// Verify active authentication session
checkAuthAndProtect();

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const analysisId = urlParams.get('id');
  const tokenParam = urlParams.get('token');
  const isPrintView = urlParams.get('print') === 'true';

  // Apply print view overrides if active
  if (isPrintView) {
    document.body.classList.add('print-mode');
    document.querySelectorAll('.accordion-item').forEach(item => {
      item.classList.add('active');
    });
  }

  // Handle Puppeteer PDF token query injection
  if (tokenParam) {
    localStorage.setItem('jwt_token', tokenParam);
  }

  if (!analysisId) {
    showToast('No analysis ID provided.', 'error');
    setTimeout(() => { window.location.href = '/pages/dashboard.html'; }, 2000);
    return;
  }

  const loadReportData = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_BASE}/analyze/${analysisId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to fetch report.');
      }

      const analysis = resData.data.analysis;
      const report = analysis.reportId;
      const data = report.reportData;

      renderReport(analysis, report, data);

    } catch (err) {
      showToast(err.message || 'Error loading report.', 'error');
    }
  };

  const renderReport = (analysis, report, data) => {
    // 1. Title and header details
    const displayUrl = analysis.url.replace(/^https?:\/\//i, '');
    const titleEl = document.getElementById('report-title-url');
    if (titleEl) titleEl.innerText = displayUrl;
    document.title = `SEO Report for ${displayUrl} | SEO Vision`;

    const dateEl = document.getElementById('report-date');
    if (dateEl) dateEl.innerText = `Scanned on ${formatDate(analysis.startedAt)}`;

    const metaDescEl = document.getElementById('report-meta-desc');
    if (metaDescEl) {
      metaDescEl.innerText = data.meta.metaDescription || 'No meta description found. Search engines will generate snippets automatically, which might not target the desired keywords.';
    }

    // Timings
    const valHttps = document.getElementById('val-https');
    if (valHttps) {
      valHttps.innerText = data.technical.httpsEnabled ? 'Yes (Secure)' : 'No (Unsecured)';
      if (!data.technical.httpsEnabled) valHttps.className = 'audit-failed font-bold';
    }
    
    const valLoadtime = document.getElementById('val-loadtime');
    if (valLoadtime) valLoadtime.innerText = `${(data.performance.loadTimeMs / 1000).toFixed(2)}s`;

    const valDomsize = document.getElementById('val-domsize');
    if (valDomsize) valDomsize.innerText = `${data.performance.domSize} nodes`;

    // 2. Dial Render
    const overallScore = report.seoScore;
    updateRadialDial('overall-dial', overallScore, 'overall-value');

    // 3. Category Progress grid
    const categories = [
      { name: 'Basic SEO', score: report.basicSeoScore },
      { name: 'Technical', score: report.technicalScore },
      { name: 'Performance', score: report.performanceScore },
      { name: 'Content', score: report.contentScore },
      { name: 'Images', score: report.imagesScore },
      { name: 'Links', score: report.linksScore },
      { name: 'Structured', score: report.structuredDataScore }
    ];

    const categoriesList = document.getElementById('categories-list');
    if (categoriesList) {
      categoriesList.innerHTML = categories.map(cat => {
        let catColor = 'var(--danger)';
        if (cat.score >= 90) catColor = 'var(--success)';
        else if (cat.score >= 50) catColor = 'var(--warning)';

        return `
          <div class="category-card glass-panel">
            <span class="category-title">${cat.name}</span>
            <div class="mini-gauge" style="background: conic-gradient(${catColor} calc(${cat.score} * 3.6deg), var(--bg-track) 0deg);">
              <div class="mini-gauge-inner">${cat.score}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 4. Recommendations List
    const recsList = document.getElementById('recommendations-list');
    const recs = report.recommendations || [];

    if (recsList) {
      if (recs.length === 0) {
        recsList.innerHTML = `<p class="font-bold audit-passed">✓ Perfect Audit! All checks passed successfully.</p>`;
      } else {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const sortedRecs = [...recs].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        recsList.innerHTML = sortedRecs.map(rec => {
          return `
            <div class="rec-item border-${rec.priority}">
              <div class="rec-header">
                <span class="rec-title">${rec.title}</span>
                <span class="priority-badge priority-${rec.priority}">${rec.priority}</span>
              </div>
              <p class="text-muted">${rec.description}</p>
              <div class="rec-fix-box">
                <strong>Suggested Fix:</strong> ${rec.fix}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 5. Detailed Audits grids
    // Meta Grid
    const metaGrid = document.getElementById('audit-meta-grid');
    if (metaGrid) {
      metaGrid.innerHTML = `
        <div class="audit-detail-card">
          <span class="form-label">Page Title</span>
          <span class="audit-val font-md">${data.meta.title || '[Missing]'}</span>
          <span class="text-muted font-sm">${data.meta.titleLength} characters</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Meta Description</span>
          <span class="audit-val font-bold font-md">${data.meta.metaDescription || '[Missing]'}</span>
          <span class="text-muted font-sm">${data.meta.descriptionLength} characters</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Meta Keywords</span>
          <span class="audit-val font-md">${data.meta.metaKeywords || '[None declared]'}</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Canonical URL</span>
          <span class="audit-val word-break-all font-md">${data.meta.canonical || '[None declared]'}</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Language Setting</span>
          <span class="audit-val font-md">${data.meta.language || '[Missing]'}</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Viewport Declared</span>
          <span class="audit-val font-md">${data.meta.viewport || '[Missing]'}</span>
        </div>
      `;
    }

    // Tech Grid
    const techGrid = document.getElementById('audit-tech-grid');
    if (techGrid) {
      techGrid.innerHTML = `
        <div class="audit-detail-card">
          <span class="form-label">HTTPS Enabled</span>
          <span class="audit-val ${data.technical.httpsEnabled ? 'audit-passed' : 'audit-failed'}">${data.technical.httpsEnabled ? 'PASSED' : 'FAILED'}</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">SSL Certificate Valid</span>
          <span class="audit-val ${data.technical.sslValid ? 'audit-passed' : 'audit-failed'}">${data.technical.sslValid ? 'PASSED' : 'FAILED'}</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Robots.txt available</span>
          <span class="audit-val ${data.technical.hasRobots ? 'audit-passed' : 'audit-failed'}">${data.technical.hasRobots ? 'PASSED' : 'FAILED'}</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Sitemap.xml available</span>
          <span class="audit-val ${data.technical.hasSitemap ? 'audit-passed' : 'audit-failed'}">${data.technical.hasSitemap ? 'PASSED' : 'FAILED'}</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Gzip/Brotli Compression</span>
          <span class="audit-val">${data.technical.compression?.toUpperCase() || 'NONE'}</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Browser Caching Rules</span>
          <span class="audit-val word-break-all font-md">${data.technical.cacheControl || 'None'}</span>
        </div>
      `;
    }

    // Content Grid
    const contentGrid = document.getElementById('audit-content-grid');
    if (contentGrid) {
      const keywordsList = data.content.keywordDensity || [];
      const densityText = keywordsList.length > 0
        ? keywordsList.map(item => `<strong>${item.keyword}</strong>: ${item.density}% (${item.count}x)`).join(', ')
        : 'No keywords parsed.';

      contentGrid.innerHTML = `
        <div class="audit-detail-card">
          <span class="form-label">Word Count</span>
          <span class="audit-val">${data.content.wordCount} words</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Readability FRE Score</span>
          <span class="audit-val">${data.content.readabilityScore} / 100</span>
          <span class="text-muted font-sm">${data.content.readabilityLabel}</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Heading Structure (H1-H6)</span>
          <span class="audit-val font-md">
            H1: ${data.headings.counts.h1} | H2: ${data.headings.counts.h2} | H3: ${data.headings.counts.h3} | H4: ${data.headings.counts.h4}
          </span>
        </div>
        <div class="audit-detail-card grid-span-2">
          <span class="form-label">Top Keywords & Densities</span>
          <span class="audit-val font-bold font-md" style="color: var(--text-primary);">${densityText}</span>
        </div>
      `;
    }

    // Links Grid
    const linksGrid = document.getElementById('audit-links-grid');
    if (linksGrid) {
      linksGrid.innerHTML = `
        <div class="audit-detail-card">
          <span class="form-label">Total Images Scanned</span>
          <span class="audit-val">${data.images.total} images</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Missing Alt attributes</span>
          <span class="audit-val ${data.images.missingAltCount > 0 ? 'audit-failed' : 'audit-passed'}">${data.images.missingAltCount} images</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Hyperlinks Indexed</span>
          <span class="audit-val">${data.links.total} links</span>
          <span class="text-muted font-sm">${data.links.internal} internal, ${data.links.external} external</span>
        </div>
        <div class="audit-detail-card">
          <span class="form-label">Broken Hyperlinks (Checks)</span>
          <span class="audit-val ${data.links.brokenCount > 0 ? 'audit-failed' : 'audit-passed'}">${data.links.brokenCount} broken</span>
        </div>
      `;
    }
  };

  const updateRadialDial = (elementId, value, valueElId) => {
    const dial = document.getElementById(elementId);
    if (!dial) return;

    const valEl = document.getElementById(valueElId);
    if (valEl) {
      valEl.innerText = value;
    }

    let themeColor = 'var(--danger)';
    if (value >= 90) themeColor = 'var(--success)';
    else if (value >= 50) themeColor = 'var(--warning)';

    dial.style.background = `conic-gradient(${themeColor} calc(${value} * 3.6deg), var(--bg-track) 0deg)`;
    if (valEl) {
      valEl.style.color = themeColor;
    }
  };

  // Bind download PDF button
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', async () => {
      const token = getToken();
      try {
        downloadPdfBtn.disabled = true;
        downloadPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';
        
        const response = await fetch(`${API_BASE}/report/download/${analysisId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate PDF report.');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SEO-Vision-Report-${analysisId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast('PDF downloaded successfully!', 'success');
      } catch (err) {
        showToast(err.message || 'Error generating PDF.', 'error');
      } finally {
        downloadPdfBtn.disabled = false;
        downloadPdfBtn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Download PDF';
      }
    });
  }

  // Bind browser print
  const printBtn = document.getElementById('print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Bind accordion actions
  const bindAccordions = () => {
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.parentElement;
        item.classList.toggle('active');
        const arrow = trigger.querySelector('span:last-child');
        if (arrow) {
          arrow.innerText = item.classList.contains('active') ? '▲' : '▼';
        }
      });
    });
  };

  bindAccordions();
  loadReportData();
});
