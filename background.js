// PricePulse Background Service Worker

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('PricePulse installed/updated');

    // Initialize storage
    await initializeStorage();

    // Set up alarms for periodic price checks
    await setupAlarms();

    // Show welcome notification
    if (details.reason === 'install') {
        showNotification(
            'Welcome to PricePulse!',
            'Start tracking prices on your favorite products.',
            'welcome'
        );
    }
});

// Initialize storage with default values
async function initializeStorage() {
    const data = await chrome.storage.local.get(null);

    if (!data.trackedItems) {
        await chrome.storage.local.set({
            trackedItems: [],
            settings: {
                checkInterval: 60, // minutes
                notifications: true,
                priceDropOnly: true,
                theme: 'dark',
                minPriceChange: 5 // minimum percentage change to notify
            },
            stats: {
                totalSaved: 0,
                priceDrops: 0,
                lastCheck: null
            }
        });
    }
}

// Set up periodic alarms
async function setupAlarms() {
    // Clear existing alarms
    await chrome.alarms.clearAll();

    // Get settings
    const { settings } = await chrome.storage.local.get(['settings']);
    const interval = settings?.checkInterval || 60;

    // Create alarm for price checking
    chrome.alarms.create('checkPrices', {
        periodInMinutes: interval
    });

    console.log(`Price check alarm set for every ${interval} minutes`);
}

// Listen for alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'checkPrices') {
        console.log('Running scheduled price check...');
        await checkAllPrices();
    }
});

// Check prices for all tracked items
async function checkAllPrices() {
    const { trackedItems, settings } = await chrome.storage.local.get(['trackedItems', 'settings']);

    if (!trackedItems || trackedItems.length === 0) {
        console.log('No items to check');
        return;
    }

    console.log(`Checking prices for ${trackedItems.length} items...`);

    let updatedItems = [];
    let priceChanges = [];

    for (const item of trackedItems) {
        try {
            const result = await checkItemPrice(item);

            if (result.updated) {
                updatedItems.push(result.item);

                // Check if price changed significantly
                if (result.priceChange !== 0) {
                    const changePercent = Math.abs(result.priceChange);

                    if (changePercent >= (settings?.minPriceChange || 5)) {
                        priceChanges.push({
                            item: result.item,
                            change: result.priceChange,
                            oldPrice: result.oldPrice,
                            newPrice: result.newPrice
                        });
                    }
                }
            } else {
                updatedItems.push(item);
            }
        } catch (error) {
            console.error(`Error checking price for ${item.url}:`, error);
            updatedItems.push(item);
        }
    }

    // Save updated items
    await chrome.storage.local.set({ trackedItems: updatedItems });

    // Update stats
    await updateStats();

    // Send notifications for price changes
    if (settings?.notifications && priceChanges.length > 0) {
        await notifyPriceChanges(priceChanges, settings);
    }

    // Update last check time
    await chrome.storage.local.set({
        stats: {
            ...(await chrome.storage.local.get(['stats'])).stats,
            lastCheck: new Date().toISOString()
        }
    });

    console.log(`Price check complete. ${priceChanges.length} changes detected.`);
}

// Check price for a single item
async function checkItemPrice(item) {
    return new Promise(async (resolve) => {
        try {
            // Create a new tab in the background
            const tab = await chrome.tabs.create({
                url: item.url,
                active: false
            });

            // Wait for the tab to load
            const loadTimeout = setTimeout(() => {
                chrome.tabs.remove(tab.id);
                resolve({ updated: false, item });
            }, 30000); // 30 second timeout

            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    clearTimeout(loadTimeout);

                    // Try to detect price
                    chrome.tabs.sendMessage(tab.id, { action: 'detectPrice' }, (response) => {
                        // Close the tab
                        chrome.tabs.remove(tab.id);

                        if (chrome.runtime.lastError || !response || !response.price) {
                            resolve({ updated: false, item });
                            return;
                        }

                        // Compare prices
                        const oldPriceValue = parseFloat(item.priceValue || item.currentPrice.replace(/[^0-9.]/g, ''));
                        const newPriceValue = response.priceValue;

                        if (oldPriceValue !== newPriceValue) {
                            const priceChange = ((newPriceValue - oldPriceValue) / oldPriceValue) * 100;

                            const updatedItem = {
                                ...item,
                                currentPrice: response.price,
                                priceValue: response.priceValue,
                                lastChecked: new Date().toISOString()
                            };

                            // Add to price history
                            if (!updatedItem.priceHistory) {
                                updatedItem.priceHistory = [];
                            }

                            updatedItem.priceHistory.push({
                                price: response.price,
                                priceValue: response.priceValue,
                                date: new Date().toISOString()
                            });

                            resolve({
                                updated: true,
                                item: updatedItem,
                                priceChange,
                                oldPrice: item.currentPrice,
                                newPrice: response.price
                            });
                        } else {
                            // Price hasn't changed, just update last checked
                            resolve({
                                updated: true,
                                item: {
                                    ...item,
                                    lastChecked: new Date().toISOString()
                                },
                                priceChange: 0
                            });
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error in checkItemPrice:', error);
            resolve({ updated: false, item });
        }
    });
}

// Send notifications for price changes
async function notifyPriceChanges(changes, settings) {
    for (const change of changes) {
        // Skip price increases if priceDropOnly is enabled
        if (settings.priceDropOnly && change.change > 0) {
            continue;
        }

        const isPriceDrop = change.change < 0;
        const title = isPriceDrop ? 'Price Drop Alert!' : 'Price Increase Alert';

        const message = `${change.item.title}\n` +
                       `${change.oldPrice} → ${change.newPrice}\n` +
                       `${isPriceDrop ? '📉' : '📈'} ${Math.abs(change.change).toFixed(1)}% ${isPriceDrop ? 'decrease' : 'increase'}`;

        await showNotification(
            title,
            message,
            'price-change',
            change.item.url
        );
    }
}

// Show browser notification
async function showNotification(title, message, type = 'info', url = null) {
    const iconUrl = chrome.runtime.getURL('icons/icon128.png');

    const notificationId = await chrome.notifications.create({
        type: 'basic',
        iconUrl: iconUrl,
        title: title,
        message: message,
        priority: 2
    });

    // Store URL for notification click handling
    if (url) {
        notificationUrls[notificationId] = url;
    }
}

// Store notification URLs for click handling
const notificationUrls = {};

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    const url = notificationUrls[notificationId];

    if (url) {
        chrome.tabs.create({ url });
        delete notificationUrls[notificationId];
    }
});

// Update statistics
async function updateStats() {
    const { trackedItems } = await chrome.storage.local.get(['trackedItems']);

    let totalSaved = 0;
    let priceDrops = 0;

    trackedItems.forEach(item => {
        const original = parseFloat(item.originalPrice?.replace(/[^0-9.]/g, '') || item.priceValue);
        const current = parseFloat(item.currentPrice?.replace(/[^0-9.]/g, '') || item.priceValue);

        if (original && current && current < original) {
            totalSaved += (original - current);
            priceDrops++;
        }
    });

    const { stats } = await chrome.storage.local.get(['stats']);

    await chrome.storage.local.set({
        stats: {
            ...stats,
            totalSaved,
            priceDrops
        }
    });
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'priceDetected') {
        console.log('Price detected on page:', request.price);
        sendResponse({ status: 'ok' });
    }

    if (request.action === 'checkNow') {
        checkAllPrices().then(() => {
            sendResponse({ status: 'complete' });
        });
        return true; // Keep channel open for async response
    }

    if (request.action === 'updateAlarms') {
        setupAlarms().then(() => {
            sendResponse({ status: 'updated' });
        });
        return true;
    }

    return false;
});

// Handle storage changes (e.g., from options page)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) {
        console.log('Settings changed, updating alarms...');
        setupAlarms();
    }
});

// Badge management
async function updateBadge() {
    const { trackedItems } = await chrome.storage.local.get(['trackedItems']);

    if (trackedItems && trackedItems.length > 0) {
        // Count items with price drops
        let drops = 0;

        trackedItems.forEach(item => {
            const original = parseFloat(item.originalPrice?.replace(/[^0-9.]/g, '') || item.priceValue);
            const current = parseFloat(item.currentPrice?.replace(/[^0-9.]/g, '') || item.priceValue);

            if (original && current && current < original) {
                drops++;
            }
        });

        if (drops > 0) {
            chrome.action.setBadgeText({ text: drops.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#4ade80' });
        } else {
            chrome.action.setBadgeText({ text: '' });
        }
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

// Update badge when storage changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.trackedItems) {
        updateBadge();
    }
});

// Initial badge update
updateBadge();

console.log('PricePulse background service worker initialized');
