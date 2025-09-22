import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('App starting...', Platform.OS);
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user ? 'logged in' : 'logged out');
        setUser(user);
        setIsLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Firebase auth error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <Text style={{ color: '#ff4444', fontSize: 16, textAlign: 'center', margin: 20 }}>
          Error: {error}
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#1a1a2e" />
      <AppNavigator />
    </>
  );
}
