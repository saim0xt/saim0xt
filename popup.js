// PricePulse Popup Script
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize UI
    await initializeUI();
    await loadCurrentPage();
    await loadTrackedItems();

    // Set up event listeners
    setupEventListeners();
});

// Initialize UI with stats
async function initializeUI() {
    const items = await StorageManager.getTrackedItems();
    const stats = await StorageManager.getStats();

    // Update stats display
    document.getElementById('watchingCount').textContent = items.length;
    document.getElementById('dropsCount').textContent = stats.priceDrops || 0;
    document.getElementById('savedAmount').textContent = `$${(stats.totalSaved || 0).toFixed(2)}`;
}

// Load current page information
async function loadCurrentPage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) {
            showError('Unable to access current tab');
            return;
        }

        // Update page info
        document.getElementById('pageTitle').textContent = tab.title || 'Unknown Page';
        document.getElementById('pageUrl').textContent = new URL(tab.url).hostname;

        // Try to detect price on page
        try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectPrice' });

            if (response && response.price) {
                document.getElementById('detectedPrice').textContent = response.price;
                document.getElementById('autoDetectBadge').innerHTML = `
                    <span class="badge-dot"></span>
                    Price detected!
                `;

                // Store detected price for tracking
                window.currentPageData = {
                    url: tab.url,
                    title: tab.title,
                    price: response.price,
                    priceValue: response.priceValue,
                    favicon: tab.favIconUrl
                };
            } else {
                document.getElementById('detectedPrice').textContent = 'No price found';
                document.getElementById('autoDetectBadge').innerHTML = `
                    <span class="badge-dot"></span>
                    No price detected
                `;
            }
        } catch (error) {
            // Content script might not be injected yet
            document.getElementById('detectedPrice').textContent = '--';
            document.getElementById('autoDetectBadge').innerHTML = `
                <span class="badge-dot"></span>
                Ready
            `;
        }
    } catch (error) {
        console.error('Error loading current page:', error);
        showError('Error loading page info');
    }
}

// Load and display tracked items
async function loadTrackedItems() {
    const items = await StorageManager.getTrackedItems();
    const trackedList = document.getElementById('trackedList');
    const emptyState = document.getElementById('emptyState');

    if (items.length === 0) {
        emptyState.style.display = 'block';
        trackedList.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';

    // Sort items by last checked (most recent first)
    items.sort((a, b) => new Date(b.lastChecked) - new Date(a.lastChecked));

    trackedList.innerHTML = items.map(item => createTrackedItemHTML(item)).join('');

    // Add event listeners to item buttons
    items.forEach(item => {
        const visitBtn = document.querySelector(`[data-visit="${item.id}"]`);
        const deleteBtn = document.querySelector(`[data-delete="${item.id}"]`);
        const refreshBtn = document.querySelector(`[data-refresh="${item.id}"]`);

        if (visitBtn) {
            visitBtn.addEventListener('click', () => visitItem(item.url));
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteItem(item.id));
        }
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => refreshItem(item.id));
        }
    });
}

// Create HTML for a tracked item
function createTrackedItemHTML(item) {
    const priceChange = calculatePriceChange(item);
    const changeClass = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'stable';
    const changeIcon = priceChange > 0 ? '↑' : priceChange < 0 ? '↓' : '→';
    const changeText = priceChange !== 0 ? `${changeIcon} ${Math.abs(priceChange).toFixed(2)}%` : 'No change';

    const lastChecked = formatRelativeTime(item.lastChecked);

    return `
        <div class="tracked-item">
            <div class="item-header">
                <div style="flex: 1; min-width: 0;">
                    <div class="item-title">${escapeHtml(item.title)}</div>
                    <div class="item-url">${new URL(item.url).hostname}</div>
                </div>
                <div class="item-actions">
                    <button class="icon-btn" data-refresh="${item.id}" title="Refresh price">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete" data-delete="${item.id}" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="item-prices">
                <div class="price-col">
                    <div class="price-col-label">Original</div>
                    <div class="price-col-value">${item.originalPrice || item.currentPrice}</div>
                </div>
                <div class="price-change ${changeClass}">
                    ${changeText}
                </div>
                <div class="price-col">
                    <div class="price-col-label">Current</div>
                    <div class="price-col-value">${item.currentPrice}</div>
                </div>
            </div>
            <div class="item-footer">
                <div class="last-checked">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    ${lastChecked}
                </div>
                <button class="visit-btn" data-visit="${item.id}">Visit</button>
            </div>
        </div>
    `;
}

// Calculate price change percentage
function calculatePriceChange(item) {
    if (!item.originalPrice || !item.currentPrice) return 0;

    const original = parseFloat(item.originalPrice.replace(/[^0-9.]/g, ''));
    const current = parseFloat(item.currentPrice.replace(/[^0-9.]/g, ''));

    if (isNaN(original) || isNaN(current) || original === 0) return 0;

    return ((current - original) / original) * 100;
}

// Format relative time
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Set up event listeners
function setupEventListeners() {
    // Track button
    document.getElementById('trackBtn').addEventListener('click', trackCurrentPage);

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', loadCurrentPage);

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', openSettings);

    // Filter button
    document.getElementById('filterBtn').addEventListener('click', toggleFilters);

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => filterItems(chip.dataset.filter));
    });

    // Clear all button
    document.getElementById('clearAllBtn').addEventListener('click', clearAllItems);

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportData);
}

// Track current page
async function trackCurrentPage() {
    if (!window.currentPageData || !window.currentPageData.priceValue) {
        showToast('No price detected on this page', 'error');
        return;
    }

    const item = {
        url: window.currentPageData.url,
        title: window.currentPageData.title,
        currentPrice: window.currentPageData.price,
        originalPrice: window.currentPageData.price,
        priceValue: window.currentPageData.priceValue,
        favicon: window.currentPageData.favicon
    };

    await StorageManager.addTrackedItem(item);
    await StorageManager.calculateStats();

    showToast('Item tracked successfully!', 'success');

    // Reload UI
    await initializeUI();
    await loadTrackedItems();
}

// Visit item
function visitItem(url) {
    chrome.tabs.create({ url });
}

// Delete item
async function deleteItem(id) {
    if (!confirm('Are you sure you want to stop tracking this item?')) {
        return;
    }

    await StorageManager.deleteTrackedItem(id);
    await StorageManager.calculateStats();

    showToast('Item removed', 'success');

    // Reload UI
    await initializeUI();
    await loadTrackedItems();
}

// Refresh item
async function refreshItem(id) {
    const items = await StorageManager.getTrackedItems();
    const item = items.find(i => i.id === id);

    if (!item) return;

    showToast('Checking price...', 'info');

    try {
        // Open tab in background and check price
        const tab = await chrome.tabs.create({ url: item.url, active: false });

        // Wait for page to load
        await new Promise(resolve => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            });
        });

        // Get price from page
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectPrice' });

        // Close the tab
        await chrome.tabs.remove(tab.id);

        if (response && response.price) {
            await StorageManager.updateTrackedItem(id, {
                currentPrice: response.price,
                priceValue: response.priceValue
            });

            await StorageManager.calculateStats();
            showToast('Price updated!', 'success');

            // Reload UI
            await initializeUI();
            await loadTrackedItems();
        } else {
            showToast('Could not detect price', 'error');
        }
    } catch (error) {
        console.error('Error refreshing price:', error);
        showToast('Error checking price', 'error');
    }
}

// Toggle filters
function toggleFilters() {
    const filterOptions = document.getElementById('filterOptions');
    filterOptions.classList.toggle('hidden');
}

// Filter items
function filterItems(filter) {
    // Update active chip
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === filter);
    });

    // Filter items
    const items = document.querySelectorAll('.tracked-item');

    items.forEach(item => {
        const priceChange = item.querySelector('.price-change');
        const shouldShow = filter === 'all' ||
                          (filter === 'dropped' && priceChange.classList.contains('down')) ||
                          (filter === 'increased' && priceChange.classList.contains('up')) ||
                          (filter === 'stable' && priceChange.classList.contains('stable'));

        item.style.display = shouldShow ? 'block' : 'none';
    });
}

// Clear all items
async function clearAllItems() {
    if (!confirm('Are you sure you want to clear all tracked items? This cannot be undone.')) {
        return;
    }

    await StorageManager.clearAllTrackedItems();

    showToast('All items cleared', 'success');

    // Reload UI
    await initializeUI();
    await loadTrackedItems();
}

// Export data
async function exportData() {
    await StorageManager.exportData();
    showToast('Data exported successfully!', 'success');
}

// Open settings
function openSettings() {
    chrome.runtime.openOptionsPage();
}

// Show error
function showError(message) {
    console.error(message);
    showToast(message, 'error');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('.toast-icon');

    // Set message
    toastMessage.textContent = message;

    // Set icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    toastIcon.textContent = icons[type] || icons.info;

    // Set color based on type
    const colors = {
        success: '#00d4aa',
        error: '#ff6b6b',
        info: '#667eea',
        warning: '#ffa726'
    };

    toastIcon.style.background = colors[type] || colors.info;
    toastIcon.style.color = 'white';
    toastIcon.style.width = '24px';
    toastIcon.style.height = '24px';
    toastIcon.style.borderRadius = '50%';
    toastIcon.style.display = 'flex';
    toastIcon.style.alignItems = 'center';
    toastIcon.style.justifyContent = 'center';
    toastIcon.style.fontSize = '14px';
    toastIcon.style.fontWeight = 'bold';

    // Show toast
    toast.classList.remove('hidden');
    toast.classList.add('show');

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}
