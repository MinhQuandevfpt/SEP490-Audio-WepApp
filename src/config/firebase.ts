import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdVpD6Hf2uNQ_VWfkSJSBxiIRI8crJpVQ",
  authDomain: "audio-560a3.firebaseapp.com",
  databaseURL: "https://audio-560a3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "audio-560a3",
  storageBucket: "audio-560a3.firebasestorage.app",
  messagingSenderId: "674545099107",
  appId: "1:674545099107:web:a6db041e9f8d5797503356",
  measurementId: "G-FGK29251HM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database (legacy - will be deprecated)
export const database = getDatabase(app);

// Initialize Firestore
export const firestore = getFirestore(app);

export default app;
