import { initializeApp, getApp, getApps } from 'firebase/app';

const firebaseConfig = {
  "projectId": "studio-6082868731-6bdf2",
  "appId": "1:256538962259:web:fba111a053e24b48d819a6",
  "apiKey": "AIzaSyCZ8fW4CpX7y80_xJ0tjNVeKvtMbumo9Yk",
  "authDomain": "studio-6082868731-6bdf2.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "256538962259"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export { app };
