import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCZ8fW4CpX7y80_xJ0tjNVeKvtMbumo9Yk",
  authDomain: "studio-6082868731-6bdf2.firebaseapp.com",
  projectId: "studio-6082868731-6bdf2",
  storageBucket: "studio-6082868731-6bdf2.appspot.com",
  messagingSenderId: "256538962259",
  appId: "1:256538962259:web:fba111a053e24b48d819a6",
  measurementId: "G-7Z0HMN55B5"
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
