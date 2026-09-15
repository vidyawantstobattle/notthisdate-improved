interface LoadingOverlayProps {
  message?: string;
  fullscreen?: boolean;
}

function LoadingOverlay({ message = 'Loading...', fullscreen = false }: LoadingOverlayProps) {
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
