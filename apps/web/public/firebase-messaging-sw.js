importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Tu configuración de Firebase (la agregaremos después)
firebase.initializeApp({
  apiKey: "AIzaSyBt6fkdbfQQEFfuBUANhXUlvqL-ctINmd8",
  authDomain: "erp-transdovic.firebaseapp.com",
  projectId: "erp-transdovic",
  storageBucket: "erp-transdovic.firebasestorage.app",
  messagingSenderId: "900203070637",
  appId: "1:900203070637:web:c29d32bcac624aaac8f224",
  measurementId: "G-FYQXMZ60TK"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Mensaje recibido en background:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});