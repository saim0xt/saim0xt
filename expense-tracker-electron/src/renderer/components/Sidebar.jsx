import React from 'react';
import { useTheme } from '../utils/ThemeContext';
import './Sidebar.css';

const Sidebar = ({ currentPage, onPageChange }) => {
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'expenses', icon: '💰', label: 'Expenses' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
    { id: 'categories', icon: '🏷️', label: 'Categories' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">💎</div>
          <div className="logo-text">
            <h1>Expense</h1>
            <p>Tracker</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          <span className="toggle-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          <span className="toggle-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
