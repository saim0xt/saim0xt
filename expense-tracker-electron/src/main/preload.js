const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Category operations
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addCategory: (data) => ipcRenderer.invoke('add-category', data),
  updateCategory: (data) => ipcRenderer.invoke('update-category', data),
  deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),

  // Expense operations
  addExpense: (data) => ipcRenderer.invoke('add-expense', data),
  updateExpense: (data) => ipcRenderer.invoke('update-expense', data),
  deleteExpense: (id) => ipcRenderer.invoke('delete-expense', id),
  getExpenses: (params) => ipcRenderer.invoke('get-expenses', params),
  getExpensesByDateRange: (params) => ipcRenderer.invoke('get-expenses-by-date-range', params),
  getExpensesByCategory: (categoryId) => ipcRenderer.invoke('get-expenses-by-category', categoryId),
  searchExpenses: (query) => ipcRenderer.invoke('search-expenses', query),

  // Analytics
  getTotalByCategory: (params) => ipcRenderer.invoke('get-total-by-category', params),
  getDailyTotal: (params) => ipcRenderer.invoke('get-daily-total', params),
  getMonthlyTotal: (year) => ipcRenderer.invoke('get-monthly-total', year),
  getTotalExpenses: (params) => ipcRenderer.invoke('get-total-expenses', params),

  // Import/Export
  exportData: (format) => ipcRenderer.invoke('export-data', format),
  importData: () => ipcRenderer.invoke('import-data'),
  bulkInsertExpenses: (expenses) => ipcRenderer.invoke('bulk-insert-expenses', expenses),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (data) => ipcRenderer.invoke('set-setting', data),

  // Maintenance
  vacuumDatabase: () => ipcRenderer.invoke('vacuum-database')
});
