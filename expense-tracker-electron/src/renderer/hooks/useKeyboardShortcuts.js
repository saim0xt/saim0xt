import { useEffect, useCallback } from 'react';

const useKeyboardShortcuts = (shortcuts) => {
  const handleKeyPress = useCallback(
    (event) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const modifierKey = ctrlKey || metaKey;

      shortcuts.forEach((shortcut) => {
        const keyMatch = shortcut.key.toLowerCase() === key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? modifierKey : !modifierKey;
        const shiftMatch = shortcut.shift ? shiftKey : !shiftKey;
        const altMatch = shortcut.alt ? altKey : !altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
        }
      });
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
};

export default useKeyboardShortcuts;

// Predefined shortcuts
export const SHORTCUTS = {
  ADD_EXPENSE: { key: 'n', ctrl: true, description: 'Add new expense' },
  SEARCH: { key: 'f', ctrl: true, description: 'Search expenses' },
  REFRESH: { key: 'r', ctrl: true, description: 'Refresh data' },
  TOGGLE_THEME: { key: 't', ctrl: true, shift: true, description: 'Toggle theme' },
  EXPORT: { key: 'e', ctrl: true, description: 'Export data' },
  IMPORT: { key: 'i', ctrl: true, description: 'Import data' },
  SETTINGS: { key: ',', ctrl: true, description: 'Open settings' },
  DASHBOARD: { key: '1', ctrl: true, description: 'Go to dashboard' },
  EXPENSES: { key: '2', ctrl: true, description: 'Go to expenses' },
  ANALYTICS: { key: '3', ctrl: true, description: 'Go to analytics' }
};
