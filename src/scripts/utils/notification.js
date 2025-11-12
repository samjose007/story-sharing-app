class NotificationManager {
  static VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

  static async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
    return null;
  }

  static async requestNotificationPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return 'denied';
  }

  static async subscribeToPush(registration) {
    if (!registration) return null;

    try {
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        return subscription;
      }

      const convertedVapidKey = this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      await this.sendSubscriptionToServer(subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  static async unsubscribeFromPush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await this.removeSubscriptionFromServer(subscription);
      return true;
    }
    return false;
  }

  static async isSubscribed() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  }

  static async toggleNotificationSubscription() {
    const isSubscribed = await this.isSubscribed();
    
    if (isSubscribed) {
      await this.unsubscribeFromPush();
      return false;
    } else {
      const registration = await navigator.serviceWorker.ready;
      await this.subscribeToPush(registration);
      return true;
    }
  }

  static urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  static async sendSubscriptionToServer(subscription) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.toJSON().keys.p256dh,
            auth: subscription.toJSON().keys.auth
          }
        })
      });

      const result = await response.json();
      if (!result.error) {
        console.log('Successfully subscribed to push notifications');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  static async removeSubscriptionFromServer(subscription) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      const result = await response.json();
      if (!result.error) {
        console.log('Successfully unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }
}

export default NotificationManager;