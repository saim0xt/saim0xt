import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  onClick,
  className = '',
  ...props
}) => {
  const buttonClasses = [
    'button',
    `button-${variant}`,
    `button-${size}`,
    fullWidth && 'button-full-width',
    disabled && 'button-disabled',
    loading && 'button-loading',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="button-spinner"></span>
          <span className="button-text">Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="button-icon">{icon}</span>}
          <span className="button-text">{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;
