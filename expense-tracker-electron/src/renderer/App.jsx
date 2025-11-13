import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './utils/ThemeContext';
import { ExpenseProvider } from './utils/ExpenseContext';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <ThemeProvider>
      <ExpenseProvider>
        <div className="app-container">
          <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
          <main className="app-main">
            {currentPage === 'dashboard' && <Dashboard />}
          </main>
        </div>
      </ExpenseProvider>
    </ThemeProvider>
  );
}

export default App;
