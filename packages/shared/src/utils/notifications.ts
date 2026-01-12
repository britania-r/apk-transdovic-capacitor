import { getToken } from 'firebase/messaging';
import { messaging } from '../lib/firebase';

export const requestNotificationPermission = async () => {
  try {
    // Verificar si estamos en web
    if (typeof window === 'undefined' || !messaging) {
      console.log('Notifications not supported in this environment');
      return null;
    }

    // Solicitar permiso
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Obtener el token FCM
      // Necesitarás tu VAPID key de Firebase Console
      const token = await getToken(messaging, {
        vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY
      });
      
      if (token) {
        console.log('FCM Token:', token);
        // Aquí guardarías el token en tu backend/Supabase
        return token;
      }
    } else {
      console.log('Notification permission denied');
    }
    
    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      // Escuchar mensajes cuando la app está en foreground
      // onMessage(messaging, (payload) => {
      //   resolve(payload);
      // });
    }
  });