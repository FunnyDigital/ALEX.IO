// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDEaMGe3FuqoutV_wC64IcseZB91t5Esj4",
  authDomain: "alexio-b7a7c.firebaseapp.com",
  databaseURL: "https://alexio-b7a7c-default-rtdb.firebaseio.com",
  projectId: "alexio-b7a7c",
  storageBucket: "alexio-b7a7c.firebasestorage.app",
  messagingSenderId: "774661291477",
  appId: "1:774661291477:web:f62395215cbe01069ed15c",
  measurementId: "G-9C9BVZ0SEY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
