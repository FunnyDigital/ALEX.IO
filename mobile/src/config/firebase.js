// Firebase configuration and initialization for React Native
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };
export const db = getFirestore(app);
export const rtdb = getDatabase(app);