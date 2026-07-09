import { checkAuthAndProtect, getToken } from '../auth.js';
import { showToast } from '../components/toast.js';
import { API_BASE } from '../api.js';

// Verify active authentication session
checkAuthAndProtect();

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const targetUrl = urlParams.get('url');

  if (!targetUrl) {
    showToast('No target URL provided.', 'error');
    setTimeout(() => { window.location.href = '/pages/dashboard.html'; }, 2000);
    return;
  }

  const targetDisplay = document.getElementById('target-display');
  if (targetDisplay) targetDisplay.innerText = targetUrl;

  const stepConnect = document.getElementById('step-connect');
  const stepCrawl = document.getElementById('step-crawl');
  const stepCheerio = document.getElementById('step-cheerio');
  const stepScore = document.getElementById('step-score');
  const stepSave = document.getElementById('step-save');

  const loaderGraphic = document.getElementById('loader-graphic');
  const loadingTitle = document.getElementById('loading-title');
  const errorBox = document.getElementById('error-message-box');
  const errorDetails = document.getElementById('error-details');
  const backBtn = document.getElementById('btn-back');
  const statusChecklist = document.getElementById('status-checklist');

  const runAnalysis = async () => {
    const token = getToken();
    
    try {
      setTimeout(() => {
        if (stepConnect) {
          stepConnect.className = 'status-item status-done';
          const icon = stepConnect.querySelector('.status-icon');
          if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        }
        if (stepCrawl) {
          stepCrawl.className = 'status-item status-active';
          const icon = stepCrawl.querySelector('.status-icon');
          if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
        }
      }, 800);

      setTimeout(() => {
        if (stepCrawl) {
          stepCrawl.className = 'status-item status-done';
          const icon = stepCrawl.querySelector('.status-icon');
          if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        }
        if (stepCheerio) {
          stepCheerio.className = 'status-item status-active';
          const icon = stepCheerio.querySelector('.status-icon');
          if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
        }
      }, 2200);

      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: targetUrl })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Crawl request failed.');
      }

      if (stepCheerio) {
        stepCheerio.className = 'status-item status-done';
        const icon = stepCheerio.querySelector('.status-icon');
        if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      }
      if (stepScore) {
        stepScore.className = 'status-item status-active';
        const icon = stepScore.querySelector('.status-icon');
        if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
      }

      setTimeout(() => {
        if (stepScore) {
          stepScore.className = 'status-item status-done';
          const icon = stepScore.querySelector('.status-icon');
          if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        }
        if (stepSave) {
          stepSave.className = 'status-item status-active';
          const icon = stepSave.querySelector('.status-icon');
          if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
        }
      }, 600);

      setTimeout(() => {
        if (stepSave) {
          stepSave.className = 'status-item status-done';
          const icon = stepSave.querySelector('.status-icon');
          if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        }
        showToast('Analysis completed successfully!', 'success');
        
        window.location.href = `/pages/report.html?id=${resData.data.analysis._id}`;
      }, 1200);

    } catch (err) {
      console.error(err);
      if (loaderGraphic) loaderGraphic.style.display = 'none';
      if (statusChecklist) statusChecklist.style.display = 'none';
      if (loadingTitle) loadingTitle.innerText = 'Audit Aborted';
      
      if (errorDetails) errorDetails.innerText = err.message || 'An unknown network error occurred during crawling.';
      if (errorBox) errorBox.style.display = 'block';
      if (backBtn) backBtn.style.display = 'inline-block';
    }
  };

  runAnalysis();
});
