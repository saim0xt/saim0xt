import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const ExpenseContext = createContext();

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const result = await window.electronAPI.getCategories();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  // Load expenses
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.getExpensesByDateRange({
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      if (result.success) {
        setExpenses(result.data);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Initial load
  useEffect(() => {
    loadCategories();
    loadExpenses();
  }, [loadCategories, loadExpenses]);

  // Add expense
  const addExpense = async (expenseData) => {
    try {
      const result = await window.electronAPI.addExpense(expenseData);
      if (result.success) {
        await loadExpenses();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Update expense
  const updateExpense = async (expenseData) => {
    try {
      const result = await window.electronAPI.updateExpense(expenseData);
      if (result.success) {
        await loadExpenses();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Delete expense
  const deleteExpense = async (id) => {
    try {
      const result = await window.electronAPI.deleteExpense(id);
      if (result.success) {
        await loadExpenses();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Search expenses
  const searchExpenses = async (query) => {
    try {
      const result = await window.electronAPI.searchExpenses(query);
      if (result.success) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Error searching expenses:', error);
      return [];
    }
  };

  // Add category
  const addCategory = async (categoryData) => {
    try {
      const result = await window.electronAPI.addCategory(categoryData);
      if (result.success) {
        await loadCategories();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Update category
  const updateCategory = async (categoryData) => {
    try {
      const result = await window.electronAPI.updateCategory(categoryData);
      if (result.success) {
        await loadCategories();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Delete category
  const deleteCategory = async (id) => {
    try {
      const result = await window.electronAPI.deleteCategory(id);
      if (result.success) {
        await loadCategories();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    expenses,
    categories,
    loading,
    dateRange,
    setDateRange,
    addExpense,
    updateExpense,
    deleteExpense,
    searchExpenses,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshExpenses: loadExpenses,
    refreshCategories: loadCategories
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};
