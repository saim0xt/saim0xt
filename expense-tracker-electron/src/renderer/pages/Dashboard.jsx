import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import Card, { CardHeader, CardTitle, CardBody } from '../components/Card';
import Button from '../components/Button';
import { useExpense } from '../utils/ExpenseContext';
import { useTheme } from '../utils/ThemeContext';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { expenses, categories, dateRange, setDateRange } = useExpense();
  const { isDark } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [totalResult, categoryResult, dailyResult] = await Promise.all([
        window.electronAPI.getTotalExpenses({
          startDate: dateRange.start,
          endDate: dateRange.end
        }),
        window.electronAPI.getTotalByCategory({
          startDate: dateRange.start,
          endDate: dateRange.end
        }),
        window.electronAPI.getDailyTotal({
          startDate: dateRange.start,
          endDate: dateRange.end
        })
      ]);

      if (totalResult.success && categoryResult.success && dailyResult.success) {
        setAnalytics({
          total: totalResult.data,
          byCategory: categoryResult.data,
          daily: dailyResult.data
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const setPresetRange = (months) => {
    const end = endOfMonth(new Date());
    const start = startOfMonth(subMonths(end, months - 1));
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  };

  // Chart colors based on theme
  const chartColors = {
    primary: isDark ? '#7c8ff0' : '#667eea',
    secondary: isDark ? '#8b6fc9' : '#764ba2',
    text: isDark ? '#f8f9fa' : '#212529',
    grid: isDark ? '#374151' : '#dee2e6',
    background: isDark ? 'rgba(124, 143, 240, 0.1)' : 'rgba(102, 126, 234, 0.1)'
  };

  // Category Chart Data
  const categoryChartData = analytics?.byCategory
    ? {
        labels: analytics.byCategory.map((cat) => cat.name),
        datasets: [
          {
            label: 'Expenses by Category',
            data: analytics.byCategory.map((cat) => cat.total),
            backgroundColor: analytics.byCategory.map((cat) => cat.color),
            borderColor: analytics.byCategory.map((cat) => cat.color),
            borderWidth: 2
          }
        ]
      }
    : null;

  // Daily Trend Chart Data
  const dailyChartData = analytics?.daily
    ? {
        labels: analytics.daily.map((day) => format(new Date(day.date), 'MMM dd')),
        datasets: [
          {
            label: 'Daily Expenses',
            data: analytics.daily.map((day) => day.total),
            borderColor: chartColors.primary,
            backgroundColor: chartColors.background,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: chartColors.primary,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#fff',
        titleColor: chartColors.text,
        bodyColor: chartColors.text,
        borderColor: chartColors.grid,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: chartColors.text
        },
        grid: {
          color: chartColors.grid
        }
      },
      x: {
        ticks: {
          color: chartColors.text
        },
        grid: {
          color: chartColors.grid
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: chartColors.text,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#fff',
        titleColor: chartColors.text,
        bodyColor: chartColors.text,
        borderColor: chartColors.grid,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Overview of your expenses for {format(new Date(dateRange.start), 'MMM dd')} -{' '}
            {format(new Date(dateRange.end), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="header-actions">
          <div className="range-selector">
            <Button size="small" variant="ghost" onClick={() => setPresetRange(1)}>
              This Month
            </Button>
            <Button size="small" variant="ghost" onClick={() => setPresetRange(3)}>
              3 Months
            </Button>
            <Button size="small" variant="ghost" onClick={() => setPresetRange(6)}>
              6 Months
            </Button>
          </div>
          <Button icon="+" onClick={() => setShowAddExpense(true)}>
            Add Expense
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <Card className="stat-card">
              <div className="stat-icon stat-icon-primary">💰</div>
              <div className="stat-content">
                <p className="stat-label">Total Expenses</p>
                <h2 className="stat-value">{formatCurrency(analytics?.total.total || 0)}</h2>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-icon stat-icon-success">📊</div>
              <div className="stat-content">
                <p className="stat-label">Transactions</p>
                <h2 className="stat-value">{analytics?.total.count || 0}</h2>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-icon stat-icon-warning">📈</div>
              <div className="stat-content">
                <p className="stat-label">Average</p>
                <h2 className="stat-value">{formatCurrency(analytics?.total.average || 0)}</h2>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-icon stat-icon-info">🏷️</div>
              <div className="stat-content">
                <p className="stat-label">Categories</p>
                <h2 className="stat-value">{analytics?.byCategory.length || 0}</h2>
              </div>
            </Card>
          </div>

          <div className="charts-grid">
            <Card className="chart-card">
              <CardHeader>
                <CardTitle>Daily Expenses Trend</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="chart-container">
                  {dailyChartData ? (
                    <Line data={dailyChartData} options={chartOptions} />
                  ) : (
                    <div className="no-data">No data available</div>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card className="chart-card">
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="chart-container">
                  {categoryChartData ? (
                    <Doughnut data={categoryChartData} options={doughnutOptions} />
                  ) : (
                    <div className="no-data">No data available</div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <Card className="recent-expenses">
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <Button size="small" variant="ghost">
                View All
              </Button>
            </CardHeader>
            <CardBody>
              <div className="expenses-list">
                {expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="expense-item">
                    <div className="expense-icon" style={{ backgroundColor: expense.category_color }}>
                      {expense.category_icon}
                    </div>
                    <div className="expense-details">
                      <p className="expense-description">{expense.description || 'No description'}</p>
                      <p className="expense-category">{expense.category_name}</p>
                    </div>
                    <div className="expense-meta">
                      <p className="expense-amount">{formatCurrency(expense.amount)}</p>
                      <p className="expense-date">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="no-expenses">
                    <p>No expenses yet. Add your first expense to get started!</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
