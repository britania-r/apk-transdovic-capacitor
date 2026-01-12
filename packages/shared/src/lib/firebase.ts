import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

let firebaseAppInstance: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

export const initializeFirebase = async (config: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}) => {
  firebaseAppInstance = initializeApp(config);
  
  // Solo inicializar messaging en web
  if (typeof window !== 'undefined') {
    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(firebaseAppInstance);
    }
  }
  
  return firebaseAppInstance;
};

export const getFirebaseApp = () => {
  if (!firebaseAppInstance) {
    throw new Error('Firebase not initialized. Call initializeFirebase first.');
  }
  return firebaseAppInstance;
};

export const getFirebaseMessaging = () => {
  return messagingInstance;
};