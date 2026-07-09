import { checkAuthAndProtect, getToken } from '../auth.js';
import { showToast } from '../components/toast.js';
import { formatUrl, formatDate } from '../utils.js';
import { API_BASE } from '../api.js';

// Verify active authentication session
checkAuthAndProtect();

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const sortFilter = document.getElementById('sort-filter');
  
  const historyList = document.getElementById('history-list');
  
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const paginationStatus = document.getElementById('pagination-status');

  let currentPage = 1;
  const limit = 10;
  let totalPages = 1;

  const fetchHistory = async () => {
    const token = getToken();
    const search = searchInput?.value.trim() || '';
    const status = statusFilter?.value || '';
    const sort = sortFilter?.value || 'newest';

    const url = `${API_BASE}/analyze/history?page=${currentPage}&limit=${limit}&keyword=${encodeURIComponent(search)}&status=${status}&sort=${sort}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to fetch audit history.');
      }

      totalPages = resData.totalPages || 1;
      currentPage = resData.page || 1;

      renderTable(resData.data.analyses || []);
      updatePaginationControls(currentPage, totalPages);

    } catch (err) {
      console.error(err);
      showToast('Error retrieving audit history logs.', 'error');
    }
  };

  const renderTable = (analyses) => {
    const mobileHistoryList = document.getElementById('mobile-history-list');

    if (historyList) {
      if (analyses.length === 0) {
        historyList.innerHTML = `
          <tr>
            <td colspan="5" class="table-empty">No website audits found matching your filters.</td>
          </tr>
        `;
      } else {
        historyList.innerHTML = analyses.map(item => {
          const isCompleted = item.status === 'completed';
          const displayUrl = formatUrl(item.url);
          const score = item.reportId?.seoScore ?? '-';
          
          let scoreClass = 'score-low';
          if (typeof score === 'number') {
            if (score >= 90) scoreClass = 'score-high';
            else if (score >= 50) scoreClass = 'score-mid';
          }

          return `
            <tr id="row-${item._id}">
              <td data-label="Website">
                <div class="history-url-cell">
                  ${isCompleted ? `<a href="/pages/report.html?id=${item._id}">${displayUrl}</a>` : displayUrl}
                </div>
              </td>
              <td data-label="Score">
                ${isCompleted ? `<span class="score-badge ${scoreClass}">${score}</span>` : '<span class="font-bold text-muted">-</span>'}
              </td>
              <td data-label="Status">
                <span class="status-pill status-${item.status}">${item.status}</span>
              </td>
              <td data-label="Date">${formatDate(item.startedAt)}</td>
              <td data-label="Actions">
                <div class="actions-cell">
                  ${isCompleted ? `
                    <a href="/pages/report.html?id=${item._id}" class="btn-action">Report</a>
                    <button class="btn-action download-pdf-btn" data-id="${item.reportId._id}">PDF</button>
                  ` : ''}
                  <button class="btn-action btn-delete delete-btn" data-id="${item._id}">Delete</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    if (mobileHistoryList) {
      if (analyses.length === 0) {
        mobileHistoryList.innerHTML = `<div class="table-empty">No website audits found matching your filters.</div>`;
      } else {
        mobileHistoryList.innerHTML = analyses.map(item => {
          const isCompleted = item.status === 'completed';
          const displayUrl = formatUrl(item.url);
          const score = item.reportId?.seoScore ?? '-';
          
          let scoreClass = 'score-low';
          if (typeof score === 'number') {
            if (score >= 90) scoreClass = 'score-high';
            else if (score >= 50) scoreClass = 'score-mid';
          }

          return `
            <div class="mobile-audit-card glass-panel" id="mobile-card-${item._id}">
              <div class="mobile-card-header">
                <span class="mobile-card-url">${isCompleted ? `<a href="/pages/report.html?id=${item._id}">${displayUrl}</a>` : displayUrl}</span>
                <span class="score-badge ${scoreClass}">${score}</span>
              </div>
              <div class="mobile-card-meta">
                <span class="status-pill status-${item.status}">${item.status}</span>
                <span class="mobile-card-date">${formatDate(item.startedAt)}</span>
              </div>
              <div class="mobile-card-actions">
                ${isCompleted ? `
                  <a href="/pages/report.html?id=${item._id}" class="btn-action mobile-btn">View Report</a>
                  <button class="btn-action mobile-btn download-pdf-btn" data-id="${item.reportId._id}">PDF</button>
                ` : ''}
                <button class="btn-action mobile-btn btn-delete delete-btn" data-id="${item._id}">Delete</button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Bind downloads click triggers for both wrappers
    const bindActions = (container) => {
      if (!container) return;
      container.querySelectorAll('.download-pdf-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const reportId = e.target.getAttribute('data-id');
          const token = getToken();
          window.open(`${API_BASE}/report/download/${reportId}?token=${token}`, '_blank');
        });
      });

      container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          confirmAndDelete(id);
        });
      });
    };

    bindActions(historyList);
    bindActions(mobileHistoryList);
  };

  const confirmAndDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this website audit? This action is permanent.')) {
      return;
    }

    const token = getToken();
    try {
      const response = await fetch(`${API_BASE}/analyze/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 204) {
        showToast('Audit deleted successfully.', 'success');
        const row = document.getElementById(`row-${id}`);
        if (row) row.remove();
        const mobileCard = document.getElementById(`mobile-card-${id}`);
        if (mobileCard) mobileCard.remove();
        fetchHistory(); // Refresh to update pagination
      } else {
        const resData = await response.json();
        throw new Error(resData.message || 'Failed to delete audit.');
      }

    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error deleting audit record.', 'error');
    }
  };

  const updatePaginationControls = (current, total) => {
    currentPage = current;
    if (paginationStatus) paginationStatus.innerText = `Page ${current} of ${total || 1}`;
    if (prevBtn) prevBtn.disabled = current <= 1;
    if (nextBtn) nextBtn.disabled = current >= total;
  };

  // Bind Control Event listeners
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentPage = 1;
        fetchHistory();
      }, 400);
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      currentPage = 1;
      fetchHistory();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', () => {
      currentPage = 1;
      fetchHistory();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        fetchHistory();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        fetchHistory();
      }
    });
  }

  // Load Initial History
  fetchHistory();
});
