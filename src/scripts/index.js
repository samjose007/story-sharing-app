import App from './pages/app.js';
import NotificationManager from './utils/notification.js';

document.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    try {
      await NotificationManager.registerServiceWorker();
      
      if (navigator.serviceWorker.controller) {
        console.log('Service Worker is controlling the page');
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  window.addEventListener('online', () => {
    document.querySelectorAll('.offline-indicator').forEach(el => el.remove());
  });

  window.addEventListener('offline', () => {
    const existingIndicator = document.querySelector('.offline-indicator');
    if (!existingIndicator) {
      const indicator = document.createElement('div');
      indicator.className = 'offline-indicator';
      indicator.textContent = 'Anda sedang offline. Beberapa fitur mungkin terbatas.';
      document.body.prepend(indicator);
    }
  });

  if (!navigator.onLine) {
    window.dispatchEvent(new Event('offline'));
  }
});