// Centered notification system for better UX
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Main notification function with centered popup
export const showTikiNotification = (message: string, title?: string, type: 'success' | 'error' = 'success', duration: number = 3000) => {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50';
  overlay.style.zIndex = '10000';

  // Create notification modal
  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all duration-300 ease-out opacity-0 scale-95';

  // Get icon and colors based on type
  const getTypeConfig = (type: string) => {
    if (type === 'success') {
      return {
        bgColor: 'bg-green-100',
        iconColor: 'text-green-500',
        icon: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>`
      };
    } else {
      return {
        bgColor: 'bg-red-100',
        iconColor: 'text-red-500',
        icon: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>`
      };
    }
  };

  const config = getTypeConfig(type);

  modal.innerHTML = `
    <div class="text-center">
      <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full ${config.bgColor} mb-4">
        <div class="${config.iconColor}">
          ${config.icon}
        </div>
      </div>
      ${title ? `<h3 class="text-lg font-semibold text-gray-900 mb-2">${title}</h3>` : ''}
      <p class="text-sm text-gray-600 leading-relaxed">${message}</p>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Trigger animation
  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0', 'scale-95');
    modal.classList.add('opacity-100', 'scale-100');
  });

  // Auto close function
  const closeNotification = () => {
    overlay.classList.add('opacity-0');
    modal.classList.add('scale-95');
    setTimeout(() => {
      if (overlay.parentNode) {
        document.body.removeChild(overlay);
      }
    }, 300);
  };

  // Auto-close after duration
  setTimeout(closeNotification, duration);

  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeNotification();
    }
  });

  // Escape key to close
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeNotification();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
};

// Convenience functions for centered notifications
export const showCenterSuccess = (message: string, title?: string, duration: number = 3000) => {
  showTikiNotification(message, title, 'success', duration);
};

export const showCenterError = (message: string, title?: string, duration: number = 3000) => {
  showTikiNotification(message, title, 'error', duration);
};

// Aliases for backward compatibility - now all use center popup
export const showSuccess = showCenterSuccess;
export const showError = showCenterError;
export const showWarning = (message: string, title?: string, duration: number = 3000) => {
  showTikiNotification(message, title, 'error', duration);
};
export const showInfo = (message: string, title?: string, duration: number = 3000) => {
  showTikiNotification(message, title, 'success', duration);
};