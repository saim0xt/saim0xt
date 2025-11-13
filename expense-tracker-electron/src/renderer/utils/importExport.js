import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const exportToCSV = async () => {
  try {
    const result = await window.electronAPI.exportData('csv');
    return result;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { success: false, error: error.message };
  }
};

export const exportToJSON = async () => {
  try {
    const result = await window.electronAPI.exportData('json');
    return result;
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    return { success: false, error: error.message };
  }
};

export const importFromCSV = async (categories) => {
  try {
    const result = await window.electronAPI.importData();

    if (!result.success) {
      return result;
    }

    return new Promise((resolve) => {
      Papa.parse(result.data, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const expenses = [];

          results.data.forEach((row) => {
            // Find category by name
            const category = categories.find(
              (cat) => cat.name.toLowerCase() === row.Category?.toLowerCase()
            );

            if (category && row.Amount && row.Date) {
              expenses.push({
                amount: parseFloat(row.Amount),
                categoryId: category.id,
                description: row.Description || '',
                date: row.Date
              });
            }
          });

          if (expenses.length > 0) {
            window.electronAPI
              .bulkInsertExpenses(expenses)
              .then((insertResult) => {
                if (insertResult.success) {
                  resolve({
                    success: true,
                    message: `Successfully imported ${expenses.length} expenses`
                  });
                } else {
                  resolve({ success: false, error: insertResult.error });
                }
              })
              .catch((error) => {
                resolve({ success: false, error: error.message });
              });
          } else {
            resolve({ success: false, error: 'No valid expenses found in the file' });
          }
        },
        error: (error) => {
          resolve({ success: false, error: error.message });
        }
      });
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return { success: false, error: error.message };
  }
};

export const importFromExcel = async (categories) => {
  try {
    const result = await window.electronAPI.importData();

    if (!result.success) {
      return result;
    }

    // Read Excel file
    const workbook = XLSX.read(result.data, { type: 'binary' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const expenses = [];

    data.forEach((row) => {
      const category = categories.find(
        (cat) => cat.name.toLowerCase() === row.Category?.toLowerCase()
      );

      if (category && row.Amount && row.Date) {
        expenses.push({
          amount: parseFloat(row.Amount),
          categoryId: category.id,
          description: row.Description || '',
          date: row.Date
        });
      }
    });

    if (expenses.length > 0) {
      const insertResult = await window.electronAPI.bulkInsertExpenses(expenses);
      if (insertResult.success) {
        return {
          success: true,
          message: `Successfully imported ${expenses.length} expenses`
        };
      } else {
        return { success: false, error: insertResult.error };
      }
    } else {
      return { success: false, error: 'No valid expenses found in the file' };
    }
  } catch (error) {
    console.error('Error importing Excel:', error);
    return { success: false, error: error.message };
  }
};

export const exportToExcel = async () => {
  try {
    // Get all expenses data
    const result = await window.electronAPI.getExpenses({ limit: 100000, offset: 0 });

    if (!result.success) {
      return result;
    }

    // Prepare data for Excel
    const excelData = result.data.map((expense) => ({
      Date: expense.date,
      Amount: expense.amount,
      Category: expense.category_name,
      Description: expense.description || '',
      'Created At': expense.created_at
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Create blob and download
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-export-${Date.now()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'Excel file downloaded successfully' };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: error.message };
  }
};
