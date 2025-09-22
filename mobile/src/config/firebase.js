// Firebase configuration and initialization for React Native & Web
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { Platform } from 'react-native';

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

// Initialize Auth differently for web and mobile
let auth;
if (Platform.OS === 'web') {
  // For web, use default auth initialization
  auth = getAuth(app);
} else {
  // For React Native, use AsyncStorage persistence
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth };
export const db = getFirestore(app);
export const rtdb = getDatabase(app);