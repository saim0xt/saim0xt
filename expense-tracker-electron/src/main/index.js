const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const database = require('../database');

let mainWindow = null;

// Performance optimization: Disable hardware acceleration on low-end systems if needed
// app.disableHardwareAcceleration();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Performance optimizations
      backgroundThrottling: false,
      disableBlinkFeatures: 'Auxclick'
    },
    frame: true,
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../../resources/icon.png')
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Initialize database
  database.initialize();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    database.close();
    app.quit();
  }
});

app.on('before-quit', () => {
  database.close();
});

// IPC Handlers - Category Operations
ipcMain.handle('get-categories', async () => {
  try {
    return { success: true, data: database.getCategories() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-category', async (event, { name, color, icon }) => {
  try {
    const result = database.addCategory(name, color, icon);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-category', async (event, { id, name, color, icon }) => {
  try {
    const result = database.updateCategory(id, name, color, icon);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-category', async (event, id) => {
  try {
    const result = database.deleteCategory(id);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers - Expense Operations
ipcMain.handle('add-expense', async (event, { amount, categoryId, description, date }) => {
  try {
    const result = database.addExpense(amount, categoryId, description, date);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-expense', async (event, { id, amount, categoryId, description, date }) => {
  try {
    const result = database.updateExpense(id, amount, categoryId, description, date);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-expense', async (event, id) => {
  try {
    const result = database.deleteExpense(id);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-expenses', async (event, { limit, offset }) => {
  try {
    const data = database.getExpenses(limit, offset);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-expenses-by-date-range', async (event, { startDate, endDate }) => {
  try {
    const data = database.getExpensesByDateRange(startDate, endDate);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-expenses-by-category', async (event, categoryId) => {
  try {
    const data = database.getExpensesByCategory(categoryId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('search-expenses', async (event, query) => {
  try {
    const data = database.searchExpenses(query);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers - Analytics
ipcMain.handle('get-total-by-category', async (event, { startDate, endDate }) => {
  try {
    const data = database.getTotalByCategory(startDate, endDate);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-daily-total', async (event, { startDate, endDate }) => {
  try {
    const data = database.getDailyTotal(startDate, endDate);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-monthly-total', async (event, year) => {
  try {
    const data = database.getMonthlyTotal(year);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-total-expenses', async (event, { startDate, endDate }) => {
  try {
    const data = database.getTotalExpenses(startDate, endDate);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers - Import/Export
ipcMain.handle('export-data', async (event, format) => {
  try {
    const data = database.exportAllData();

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Data',
      defaultPath: `expenses-export-${Date.now()}.${format}`,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'CSV', extensions: ['csv'] }
      ]
    });

    if (filePath) {
      if (format === 'json' || filePath.endsWith('.json')) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      } else if (format === 'csv' || filePath.endsWith('.csv')) {
        // Convert to CSV format
        const csvLines = ['Date,Amount,Category,Description'];
        data.expenses.forEach(exp => {
          const line = `${exp.date},${exp.amount},"${exp.category_name}","${exp.description || ''}"`;
          csvLines.push(line);
        });
        fs.writeFileSync(filePath, csvLines.join('\n'));
      }

      return { success: true, filePath };
    }

    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-data', async (event) => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Data',
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'CSV', extensions: ['csv'] }
      ],
      properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
      const filePath = filePaths[0];
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      return { success: true, data: fileContent, filePath };
    }

    return { success: false, error: 'Import cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bulk-insert-expenses', async (event, expenses) => {
  try {
    database.bulkInsertExpenses(expenses);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC Handlers - Settings
ipcMain.handle('get-setting', async (event, key) => {
  try {
    const value = database.getSetting(key);
    return { success: true, data: value };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-setting', async (event, { key, value }) => {
  try {
    database.setSetting(key, value);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Database maintenance
ipcMain.handle('vacuum-database', async () => {
  try {
    database.vacuum();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
