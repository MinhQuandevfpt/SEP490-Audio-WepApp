// Notification system with top-down animation
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number; // milliseconds
  position?: 'top-right' | 'top-center' | 'top-left';
  autoClose?: boolean;
}

class NotificationManager {
  private container: HTMLElement | null = null;
  private notifications: Set<HTMLElement> = new Set();

  private createContainer() {
    if (this.container) return this.container;

    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = 'fixed top-4 right-4 z-50 space-y-3 pointer-events-none';
    this.container.style.zIndex = '9999';
    document.body.appendChild(this.container);

    return this.container;
  }

  private getNotificationClasses(type: NotificationType): string {
    const baseClasses = 'pointer-events-auto transform transition-all duration-500 ease-in-out';
    const typeClasses = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    return `${baseClasses} ${typeClasses[type]}`;
  }

  private getIconSVG(type: NotificationType): string {
    const iconClasses = {
      success: 'text-green-400',
      error: 'text-red-400', 
      warning: 'text-yellow-400',
      info: 'text-blue-400'
    };

    const icons = {
      success: `<svg class="w-5 h-5 ${iconClasses[type]}" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>`,
      error: `<svg class="w-5 h-5 ${iconClasses[type]}" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>`,
      warning: `<svg class="w-5 h-5 ${iconClasses[type]}" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>`,
      info: `<svg class="w-5 h-5 ${iconClasses[type]}" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>`
    };

    return icons[type];
  }

  show(options: NotificationOptions): void {
    const container = this.createContainer();
    
    const notification = document.createElement('div');
    notification.className = `${this.getNotificationClasses(options.type)} max-w-sm w-full bg-white shadow-lg rounded-lg border p-4 opacity-0 translate-y-[-20px]`;

    const closeButton = `
      <button class="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none" onclick="this.parentElement.remove()">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    `;

    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${this.getIconSVG(options.type)}
        </div>
        <div class="ml-3 w-0 flex-1">
          ${options.title ? `<p class="text-sm font-medium">${options.title}</p>` : ''}
          <p class="text-sm ${options.title ? 'mt-1' : ''}">${options.message}</p>
        </div>
        ${closeButton}
      </div>
    `;

    container.appendChild(notification);
    this.notifications.add(notification);

    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.remove('opacity-0', 'translate-y-[-20px]');
      notification.classList.add('opacity-100', 'translate-y-0');
    });

    // Auto-close
    if (options.autoClose !== false) {
      const duration = options.duration || 5000;
      setTimeout(() => {
        this.hide(notification);
      }, duration);
    }

    // Close button event
    const closeBtn = notification.querySelector('button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide(notification);
      });
    }
  }

  private hide(notification: HTMLElement): void {
    notification.classList.add('opacity-0', 'translate-y-[-20px]');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.notifications.delete(notification);
      
      // Remove container if no notifications left
      if (this.notifications.size === 0 && this.container) {
        document.body.removeChild(this.container);
        this.container = null;
      }
    }, 500);
  }

  // Clear all notifications
  clear(): void {
    this.notifications.forEach(notification => {
      this.hide(notification);
    });
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();

// Convenience methods
export const showSuccess = (message: string, title?: string, duration?: number) => {
  notificationManager.show({
    type: 'success',
    message,
    title,
    duration
  });
};

export const showError = (message: string, title?: string, duration?: number) => {
  notificationManager.show({
    type: 'error',
    message,
    title,
    duration
  });
};

export const showWarning = (message: string, title?: string, duration?: number) => {
  notificationManager.show({
    type: 'warning',
    message,
    title,
    duration
  });
};

export const showInfo = (message: string, title?: string, duration?: number) => {
  notificationManager.show({
    type: 'info',
    message,
    title,
    duration
  });
};

// Tiki-style centered notification system
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

// Convenience functions
export const showCenterSuccess = (message: string, title?: string, duration: number = 3000) => {
  showTikiNotification(message, title, 'success', duration);
};

export const showCenterError = (message: string, title?: string, duration: number = 3000) => {
  showTikiNotification(message, title, 'error', duration);
};