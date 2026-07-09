import { checkAuthAndProtect, getToken } from '../auth.js';
import { showToast } from '../components/toast.js';
import { API_BASE } from '../api.js';

// Verify active authentication session
checkAuthAndProtect();

document.addEventListener('DOMContentLoaded', () => {
  let cachedChartData = null;
  const analyzeForm = document.getElementById('analyze-form');
  const targetUrlInput = document.getElementById('target-url');
  
  const statTotal = document.getElementById('stat-total-audits');
  const statSeo = document.getElementById('stat-avg-seo');
  const statPerf = document.getElementById('stat-avg-perf');
  
  const recentAuditsList = document.getElementById('recent-audits-list');

  // Submit Quick URL to Loading Audit view
  if (analyzeForm) {
    analyzeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let url = targetUrlInput.value.trim();

      if (!url) {
        showToast('Please provide a URL to audit.', 'warning');
        return;
      }

      const submitBtn = document.getElementById('analyze-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
      }

      window.location.href = `/pages/loading.html?url=${encodeURIComponent(url)}`;
    });
  }

  // Fetch Audit History to calculate stats & render lists
  const loadDashboardData = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_BASE}/analyze/history?limit=100&sort=newest`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to fetch dashboard history.');
      }

      const analyses = resData.data.analyses || [];
      const completedAnalyses = analyses.filter(item => item.status === 'completed' && item.reportId);

      // Update total audits count card
      if (statTotal) statTotal.innerText = resData.totalResults || 0;

      // Calculate Averages
      let avgSeo = 0;
      let avgPerf = 0;

      const catSums = {
        basic: 0,
        technical: 0,
        performance: 0,
        content: 0,
        images: 0,
        links: 0,
        structured: 0
      };

      if (completedAnalyses.length > 0) {
        completedAnalyses.forEach(item => {
          const report = item.reportId;
          avgSeo += report.seoScore || 0;
          avgPerf += report.performanceScore || 0;

          catSums.basic += report.basicSeoScore || 0;
          catSums.technical += report.technicalScore || 0;
          catSums.performance += report.performanceScore || 0;
          catSums.content += report.contentScore || 0;
          catSums.images += report.imagesScore || 0;
          catSums.links += report.linksScore || 0;
          catSums.structured += report.structuredDataScore || 0;
        });

        const totalCompleted = completedAnalyses.length;
        avgSeo = Math.round(avgSeo / totalCompleted);
        avgPerf = Math.round(avgPerf / totalCompleted);

        if (statSeo) statSeo.innerText = `${avgSeo}%`;
        if (statPerf) statPerf.innerText = `${avgPerf}%`;

        cachedChartData = {
          'Basic SEO': Math.round(catSums.basic / totalCompleted),
          'Technical': Math.round(catSums.technical / totalCompleted),
          'Performance': Math.round(catSums.performance / totalCompleted),
          'Content': Math.round(catSums.content / totalCompleted),
          'Images': Math.round(catSums.images / totalCompleted),
          'Links': Math.round(catSums.links / totalCompleted),
          'Structured': Math.round(catSums.structured / totalCompleted)
        };
        drawCanvasChart(cachedChartData);
      } else {
        if (statSeo) statSeo.innerText = '0%';
        if (statPerf) statPerf.innerText = '0%';
        cachedChartData = {
          'Basic SEO': 0,
          'Technical': 0,
          'Performance': 0,
          'Content': 0,
          'Images': 0,
          'Links': 0,
          'Structured': 0
        };
        drawCanvasChart(cachedChartData);
      }

      renderRecentTable(analyses.slice(0, 5));

    } catch (err) {
      console.error(err);
      showToast('Error loading dashboard statistics.', 'error');
    }
  };

  const renderRecentTable = (analyses) => {
    const mobileRecentList = document.getElementById('mobile-recent-list');

    if (recentAuditsList) {
      if (analyses.length === 0) {
        recentAuditsList.innerHTML = `
          <tr>
            <td colspan="5" class="table-empty">No audits yet. Run your first audit above!</td>
          </tr>
        `;
      } else {
        recentAuditsList.innerHTML = analyses.map(item => {
          const formattedDate = new Date(item.startedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          const displayUrl = item.url.replace(/^https?:\/\//i, '');
          const score = item.reportId?.seoScore ?? '-';
          let scoreClass = 'score-low';
          if (typeof score === 'number') {
            if (score >= 90) scoreClass = 'score-high';
            else if (score >= 50) scoreClass = 'score-mid';
          }

          const isCompleted = item.status === 'completed';

          return `
            <tr>
              <td data-label="Website">
                <div class="recent-url-cell">
                  ${isCompleted ? `<a href="/pages/report.html?id=${item._id}">${displayUrl}</a>` : displayUrl}
                </div>
              </td>
              <td data-label="Score">
                ${isCompleted ? `<span class="score-badge-sm ${scoreClass}">${score}</span>` : '<span class="font-bold text-muted">-</span>'}
              </td>
              <td data-label="Status">
                <span class="status-pill-sm status-${item.status}">${item.status}</span>
              </td>
              <td data-label="Date">${formattedDate}</td>
              <td data-label="Action" class="text-right">
                ${isCompleted ? `<a href="/pages/report.html?id=${item._id}" class="btn-action">View Report</a>` : ''}
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    if (mobileRecentList) {
      if (analyses.length === 0) {
        mobileRecentList.innerHTML = `<div class="table-empty">No audits yet. Run your first audit above!</div>`;
      } else {
        mobileRecentList.innerHTML = analyses.map(item => {
          const formattedDate = new Date(item.startedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          const displayUrl = item.url.replace(/^https?:\/\//i, '');
          const score = item.reportId?.seoScore ?? '-';
          let scoreClass = 'score-low';
          if (typeof score === 'number') {
            if (score >= 90) scoreClass = 'score-high';
            else if (score >= 50) scoreClass = 'score-mid';
          }

          const isCompleted = item.status === 'completed';

          return `
            <div class="mobile-audit-card glass-panel">
              <div class="mobile-card-header">
                <span class="mobile-card-url">${isCompleted ? `<a href="/pages/report.html?id=${item._id}">${displayUrl}</a>` : displayUrl}</span>
                <span class="score-badge-sm ${scoreClass}">${score}</span>
              </div>
              <div class="mobile-card-meta">
                <span class="status-pill-sm status-${item.status}">${item.status}</span>
                <span class="mobile-card-date">${formattedDate}</span>
              </div>
              <div class="mobile-card-actions">
                ${isCompleted ? `<a href="/pages/report.html?id=${item._id}" class="btn-action mobile-btn">View Report</a>` : ''}
              </div>
            </div>
          `;
        }).join('');
      }
    }
  };

  const drawCanvasChart = (data) => {
    const canvas = document.getElementById('average-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const keys = Object.keys(data);
    const values = Object.values(data);
    const count = keys.length;

    const paddingLeft = 120;
    const paddingRight = 45;
    const paddingTop = 20;
    const paddingBottom = 25;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const barHeight = Math.min(18, (chartHeight / count) - 12);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.font = '12px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';

    [0, 25, 50, 75, 100].forEach(val => {
      const x = paddingLeft + (val / 100) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, height - paddingBottom);
      ctx.stroke();
      ctx.fillText(val, x, height - 6);
    });

    keys.forEach((key, idx) => {
      const val = values[idx];
      const y = paddingTop + (idx * (chartHeight / count)) + ((chartHeight / count - barHeight) / 2);
      
      ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
      ctx.font = '500 13px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(key, paddingLeft - 12, y + (barHeight / 2) + 4);

      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)';
      ctx.beginPath();
      ctx.roundRect(paddingLeft, y, chartWidth, barHeight, 4);
      ctx.fill();

      const fillWidth = (val / 100) * chartWidth;
      if (fillWidth > 0) {
        const grad = ctx.createLinearGradient(paddingLeft, y, paddingLeft + fillWidth, y);
        
        let col1 = '#ef4444', col2 = '#f87171';
        if (val >= 90) {
          col1 = '#10b981'; col2 = '#34d399';
        } else if (val >= 50) {
          col1 = '#f59e0b'; col2 = '#fbbf24';
        }

        grad.addColorStop(0, col1);
        grad.addColorStop(1, col2);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(paddingLeft, y, fillWidth, barHeight, 4);
        ctx.fill();
      }

      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${val}%`, paddingLeft + fillWidth + 8, y + (barHeight / 2) + 4);
    });
  };

  window.addEventListener('resize', () => {
    if (cachedChartData) {
      drawCanvasChart(cachedChartData);
    }
  });

  window.addEventListener('themeChanged', () => {
    if (cachedChartData) {
      drawCanvasChart(cachedChartData);
    }
  });

  loadDashboardData();
});
