// Storage Manager for PricePulse Extension
const StorageManager = {
    // Initialize storage with default values
    async init() {
        const data = await this.getAll();
        if (!data.trackedItems) {
            await chrome.storage.local.set({
                trackedItems: [],
                settings: {
                    checkInterval: 60, // minutes
                    notifications: true,
                    priceDropOnly: false,
                    theme: 'dark'
                },
                stats: {
                    totalSaved: 0,
                    priceDrops: 0
                }
            });
        }
    },

    // Get all data from storage
    async getAll() {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (data) => {
                resolve(data || {});
            });
        });
    },

    // Get tracked items
    async getTrackedItems() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['trackedItems'], (data) => {
                resolve(data.trackedItems || []);
            });
        });
    },

    // Add a new tracked item
    async addTrackedItem(item) {
        const items = await this.getTrackedItems();

        // Check if item already exists (by URL)
        const existingIndex = items.findIndex(i => i.url === item.url);

        if (existingIndex !== -1) {
            // Update existing item
            items[existingIndex] = {
                ...items[existingIndex],
                ...item,
                lastChecked: new Date().toISOString()
            };
        } else {
            // Add new item with ID and timestamps
            const newItem = {
                id: Date.now().toString(),
                ...item,
                addedDate: new Date().toISOString(),
                lastChecked: new Date().toISOString(),
                priceHistory: [{
                    price: item.currentPrice,
                    date: new Date().toISOString()
                }]
            };
            items.push(newItem);
        }

        await chrome.storage.local.set({ trackedItems: items });
        return items;
    },

    // Update a tracked item
    async updateTrackedItem(id, updates) {
        const items = await this.getTrackedItems();
        const index = items.findIndex(item => item.id === id);

        if (index !== -1) {
            items[index] = {
                ...items[index],
                ...updates,
                lastChecked: new Date().toISOString()
            };

            // Add to price history if price changed
            if (updates.currentPrice && updates.currentPrice !== items[index].currentPrice) {
                if (!items[index].priceHistory) {
                    items[index].priceHistory = [];
                }
                items[index].priceHistory.push({
                    price: updates.currentPrice,
                    date: new Date().toISOString()
                });
            }

            await chrome.storage.local.set({ trackedItems: items });
        }

        return items;
    },

    // Delete a tracked item
    async deleteTrackedItem(id) {
        const items = await this.getTrackedItems();
        const filtered = items.filter(item => item.id !== id);
        await chrome.storage.local.set({ trackedItems: filtered });
        return filtered;
    },

    // Clear all tracked items
    async clearAllTrackedItems() {
        await chrome.storage.local.set({ trackedItems: [] });
        await this.updateStats({ totalSaved: 0, priceDrops: 0 });
        return [];
    },

    // Get settings
    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['settings'], (data) => {
                resolve(data.settings || {
                    checkInterval: 60,
                    notifications: true,
                    priceDropOnly: false,
                    theme: 'dark'
                });
            });
        });
    },

    // Update settings
    async updateSettings(newSettings) {
        const settings = await this.getSettings();
        const updated = { ...settings, ...newSettings };
        await chrome.storage.local.set({ settings: updated });
        return updated;
    },

    // Get stats
    async getStats() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['stats'], (data) => {
                resolve(data.stats || { totalSaved: 0, priceDrops: 0 });
            });
        });
    },

    // Update stats
    async updateStats(newStats) {
        const stats = await this.getStats();
        const updated = { ...stats, ...newStats };
        await chrome.storage.local.set({ stats: updated });
        return updated;
    },

    // Calculate and update statistics
    async calculateStats() {
        const items = await this.getTrackedItems();
        let totalSaved = 0;
        let priceDrops = 0;

        items.forEach(item => {
            if (item.originalPrice && item.currentPrice) {
                const saved = item.originalPrice - item.currentPrice;
                if (saved > 0) {
                    totalSaved += saved;
                    priceDrops++;
                }
            }
        });

        await this.updateStats({ totalSaved, priceDrops });
        return { totalSaved, priceDrops };
    },

    // Export data as JSON
    async exportData() {
        const data = await this.getAll();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `pricepulse-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
    },

    // Import data from JSON
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            await chrome.storage.local.set(data);
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }
};

// Initialize storage when script loads
if (typeof chrome !== 'undefined' && chrome.storage) {
    StorageManager.init();
}
