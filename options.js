// PricePulse Options Page Script

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadStats();
    setupEventListeners();
});

// Load current settings
async function loadSettings() {
    const settings = await StorageManager.getSettings();

    // Set form values
    document.getElementById('checkInterval').value = settings.checkInterval || 60;
    document.getElementById('notifications').checked = settings.notifications !== false;
    document.getElementById('priceDropOnly').checked = settings.priceDropOnly !== false;
    document.getElementById('theme').value = settings.theme || 'dark';

    const minPriceChange = settings.minPriceChange || 5;
    document.getElementById('minPriceChange').value = minPriceChange;
    document.getElementById('minPriceChangeValue').textContent = minPriceChange + '%';
}

// Load statistics
async function loadStats() {
    const items = await StorageManager.getTrackedItems();
    const stats = await StorageManager.getStats();

    document.getElementById('totalTracked').textContent = items.length;
    document.getElementById('totalSaved').textContent = `$${(stats.totalSaved || 0).toFixed(2)}`;

    if (stats.lastCheck) {
        const lastCheck = new Date(stats.lastCheck);
        document.getElementById('lastCheck').textContent = formatRelativeTime(lastCheck);
    } else {
        document.getElementById('lastCheck').textContent = 'Never';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Slider update
    document.getElementById('minPriceChange').addEventListener('input', (e) => {
        document.getElementById('minPriceChangeValue').textContent = e.target.value + '%';
    });

    // Save button
    document.getElementById('saveBtn').addEventListener('click', saveSettings);

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetSettings);

    // Export data button
    document.getElementById('exportDataBtn').addEventListener('click', exportData);

    // Import data button
    document.getElementById('importDataBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });

    // Import file input
    document.getElementById('importFileInput').addEventListener('change', handleImportFile);

    // Clear all button
    document.getElementById('clearAllBtn').addEventListener('click', clearAllData);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 's') {
                e.preventDefault();
                saveSettings();
            }
        }
    });
}

// Save settings
async function saveSettings() {
    const newSettings = {
        checkInterval: parseInt(document.getElementById('checkInterval').value),
        notifications: document.getElementById('notifications').checked,
        priceDropOnly: document.getElementById('priceDropOnly').checked,
        theme: document.getElementById('theme').value,
        minPriceChange: parseInt(document.getElementById('minPriceChange').value)
    };

    await StorageManager.updateSettings(newSettings);

    // Update alarms with new interval
    chrome.runtime.sendMessage({ action: 'updateAlarms' });

    showToast('Settings saved successfully!', 'success');
}

// Reset to default settings
async function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
        return;
    }

    const defaultSettings = {
        checkInterval: 60,
        notifications: true,
        priceDropOnly: true,
        theme: 'dark',
        minPriceChange: 5
    };

    await StorageManager.updateSettings(defaultSettings);

    // Reload settings
    await loadSettings();

    // Update alarms
    chrome.runtime.sendMessage({ action: 'updateAlarms' });

    showToast('Settings reset to defaults', 'success');
}

// Export data
async function exportData() {
    await StorageManager.exportData();
    showToast('Data exported successfully!', 'success');
}

// Handle import file
async function handleImportFile(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.name.endsWith('.json')) {
        showToast('Please select a valid JSON file', 'error');
        return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const jsonData = e.target.result;
            const success = await StorageManager.importData(jsonData);

            if (success) {
                showToast('Data imported successfully!', 'success');

                // Reload settings and stats
                await loadSettings();
                await loadStats();
            } else {
                showToast('Failed to import data. Invalid format.', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            showToast('Error importing data', 'error');
        }
    };

    reader.onerror = () => {
        showToast('Error reading file', 'error');
    };

    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

// Clear all data
async function clearAllData() {
    const confirmation = prompt(
        'This will delete ALL tracked items and statistics. Type "DELETE" to confirm:'
    );

    if (confirmation !== 'DELETE') {
        return;
    }

    await StorageManager.clearAllTrackedItems();

    showToast('All data cleared', 'success');

    // Reload stats
    await loadStats();
}

// Format relative time
function formatRelativeTime(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
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

// Apply theme (for future implementation)
async function applyTheme() {
    const settings = await StorageManager.getSettings();
    const theme = settings.theme || 'dark';

    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else if (theme === 'auto') {
        // Detect system theme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.body.classList.add('light-theme');
        }
    }
}

// Initialize theme
applyTheme();
