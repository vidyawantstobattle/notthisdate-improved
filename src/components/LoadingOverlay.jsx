import React from 'react';

function LoadingOverlay({ message = 'Loading...', fullscreen = false }) {
  return (
    <div 
      className={`loading-overlay ${fullscreen ? 'loading-overlay-fullscreen' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
}

export default LoadingOverlay;
