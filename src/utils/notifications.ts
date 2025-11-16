/**
 * Toast notification system to replace alert() calls
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'bottom';
}

let toastContainer: HTMLDivElement | null = null;

/**
 * Initialize toast container
 */
function initToastContainer(): HTMLDivElement {
  if (toastContainer) {
    return toastContainer;
  }

  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  `;

  document.body.appendChild(toastContainer);
  return toastContainer;
}

/**
 * Show a toast notification
 */
export function showToast(options: ToastOptions): void {
  const {
    message,
    type = 'info',
    duration = 3000
  } = options;

  const container = initToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Icon based on type
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  // Colors based on type
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196F3'
  };

  toast.innerHTML = `
    <div style="
      background: rgba(16, 18, 20, 0.95);
      backdrop-filter: blur(10px);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 400px;
      pointer-events: auto;
      border-left: 4px solid ${colors[type]};
      animation: slideIn 0.3s ease;
    ">
      <span style="
        font-size: 20px;
        color: ${colors[type]};
        font-weight: bold;
      ">${icons[type]}</span>
      <span style="flex: 1;">${message}</span>
    </div>
  `;

  // Add animation keyframes
  if (!document.querySelector('#toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      container.removeChild(toast);

      // Remove container if no more toasts
      if (container.children.length === 0) {
        document.body.removeChild(container);
        toastContainer = null;
      }
    }, 300);
  }, duration);
}

/**
 * Convenience methods
 */
export const toast = {
  success: (message: string, duration?: number) =>
    showToast({ message, type: 'success', duration }),

  error: (message: string, duration?: number) =>
    showToast({ message, type: 'error', duration }),

  warning: (message: string, duration?: number) =>
    showToast({ message, type: 'warning', duration }),

  info: (message: string, duration?: number) =>
    showToast({ message, type: 'info', duration })
};
