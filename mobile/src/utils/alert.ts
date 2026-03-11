import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert utility.
 * On native, uses React Native's Alert.alert().
 * On web, uses non-blocking DOM overlays since RN Alert is a no-op on web
 * and window.alert/confirm are blocking calls that break browser extensions.
 */

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// Ensure animation styles are injected once
function ensureStyles(): void {
  if (document.getElementById('proximity-alert-styles')) return;
  const style = document.createElement('style');
  style.id = 'proximity-alert-styles';
  style.textContent = `
    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes toastSlideOut {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Show a non-blocking toast-style notification on web.
 */
function showWebToast(title: string, message?: string, isError = true): void {
  const existing = document.getElementById('proximity-toast');
  if (existing) existing.remove();

  ensureStyles();

  const toast = document.createElement('div');
  toast.id = 'proximity-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${isError ? '#FF4444' : '#333'};
    color: white;
    padding: 14px 24px;
    border-radius: 12px;
    z-index: 99999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    max-width: 90%;
    text-align: center;
    animation: toastSlideIn 0.3s ease-out;
    cursor: pointer;
  `;

  const titleEl = document.createElement('div');
  titleEl.style.fontWeight = '600';
  titleEl.style.marginBottom = message ? '4px' : '0';
  titleEl.textContent = title;
  toast.appendChild(titleEl);

  if (message) {
    const msgEl = document.createElement('div');
    msgEl.style.fontSize = '13px';
    msgEl.style.opacity = '0.9';
    msgEl.textContent = message;
    toast.appendChild(msgEl);
  }

  document.body.appendChild(toast);

  toast.addEventListener('click', () => {
    toast.style.animation = 'toastSlideOut 0.2s ease-in forwards';
    setTimeout(() => toast.remove(), 200);
  });

  setTimeout(() => {
    if (document.getElementById('proximity-toast') === toast) {
      toast.style.animation = 'toastSlideOut 0.2s ease-in forwards';
      setTimeout(() => toast.remove(), 200);
    }
  }, 3000);
}

/**
 * Show a non-blocking confirm dialog overlay on web.
 */
function showWebConfirm(
  title: string,
  message: string | undefined,
  cancelBtn: AlertButton | undefined,
  actionBtn: AlertButton | undefined,
): void {
  const existing = document.getElementById('proximity-confirm-overlay');
  if (existing) existing.remove();

  ensureStyles();

  // Backdrop
  const overlay = document.createElement('div');
  overlay.id = 'proximity-confirm-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: modalFadeIn 0.2s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Dialog box
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 24px;
    max-width: 340px;
    width: 85%;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    text-align: center;
  `;

  // Title
  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px;';
  titleEl.textContent = title;
  dialog.appendChild(titleEl);

  // Message
  if (message) {
    const msgEl = document.createElement('div');
    msgEl.style.cssText = 'font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.4;';
    msgEl.textContent = message;
    dialog.appendChild(msgEl);
  }

  // Button row
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display: flex; gap: 12px; justify-content: center;';

  // Cancel button
  const cancelBtnEl = document.createElement('button');
  cancelBtnEl.style.cssText = `
    flex: 1; padding: 12px 16px; border-radius: 10px; border: 2px solid #ddd;
    background: white; color: #666; font-size: 15px; font-weight: 600;
    cursor: pointer; transition: background 0.15s;
  `;
  cancelBtnEl.textContent = cancelBtn?.text || 'Cancel';
  cancelBtnEl.addEventListener('click', () => {
    overlay.remove();
    cancelBtn?.onPress?.();
  });
  cancelBtnEl.addEventListener('mouseenter', () => { cancelBtnEl.style.background = '#f5f5f5'; });
  cancelBtnEl.addEventListener('mouseleave', () => { cancelBtnEl.style.background = 'white'; });
  btnRow.appendChild(cancelBtnEl);

  // Action button
  const actionBtnEl = document.createElement('button');
  const isDestructive = actionBtn?.style === 'destructive';
  actionBtnEl.style.cssText = `
    flex: 1; padding: 12px 16px; border-radius: 10px; border: none;
    background: ${isDestructive ? '#FF4444' : '#6C5CE7'}; color: white;
    font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.15s;
  `;
  actionBtnEl.textContent = actionBtn?.text || 'OK';
  actionBtnEl.addEventListener('click', () => {
    overlay.remove();
    actionBtn?.onPress?.();
  });
  actionBtnEl.addEventListener('mouseenter', () => { actionBtnEl.style.opacity = '0.85'; });
  actionBtnEl.addEventListener('mouseleave', () => { actionBtnEl.style.opacity = '1'; });
  btnRow.appendChild(actionBtnEl);

  dialog.appendChild(btnRow);
  overlay.appendChild(dialog);

  // Click outside to cancel
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      cancelBtn?.onPress?.();
    }
  });

  document.body.appendChild(overlay);
}

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  if (Platform.OS === 'web') {
    if (!buttons || buttons.length <= 1) {
      // Simple alert - show as toast
      showWebToast(title, message);
      if (buttons?.[0]?.onPress) {
        buttons[0].onPress();
      }
    } else if (buttons.length >= 2) {
      // Two+ buttons: show as non-blocking confirm dialog
      const cancelBtn = buttons.find((b) => b.style === 'cancel');
      const actionBtn = buttons.find((b) => b.style !== 'cancel') || buttons[1];
      showWebConfirm(title, message, cancelBtn, actionBtn);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
