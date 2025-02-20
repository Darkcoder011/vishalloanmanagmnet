import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAhJ8pT6POqtOV8MV0gWo-ygX8Qfj5iA30",
  authDomain: "loan-35069.firebaseapp.com",
  databaseURL: "https://loan-35069-default-rtdb.firebaseio.com",
  projectId: "loan-35069",
  storageBucket: "loan-35069.firebasestorage.app",
  messagingSenderId: "932947183274",
  appId: "1:932947183274:web:00888541b771c0a1efb2d3",
  measurementId: "G-14HB94VKLX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const analytics = getAnalytics(app);

export default app;
