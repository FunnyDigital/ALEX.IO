import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Animated,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => setForm({ ...form, [name]: value });

  const handleSubmit = async () => {
    if (!form.email || !form.password || (!isLogin && !form.username)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
        const userRef = doc(db, 'users', userCredential.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            username: '',
            email: form.email,
            wallet: 1000,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: form.username,
          email: form.email,
          wallet: 1000,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e1b4b']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>ALEX.IO</Text>
              <Text style={styles.subtitle}>
                {isLogin ? 'Welcome back, trader.' : 'Join the elite club.'}
              </Text>
            </View>
  
            <View style={styles.formContainer}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}
                style={styles.formCard}
              >
                {!isLogin && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="johndoe"
                      placeholderTextColor="#64748b"
                      value={form.username}
                      onChangeText={(text) => handleChange('username', text)}
                      autoCapitalize="none"
                    />
                  </View>
                )}
  
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="#64748b"
                    value={form.email}
                    onChangeText={(text) => handleChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
  
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#64748b"
                    value={form.password}
                    onChangeText={(text) => handleChange('password', text)}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
  
                <TouchableOpacity
                  style={loading ? styles.buttonDisabled : styles.buttonContainer}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#475569', '#334155'] : ['#fbbf24', '#f59e0b']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
  
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setIsLogin(!isLogin)}
                >
                  <Text style={styles.switchTextMain}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <Text style={styles.switchTextHighlight}>
                      {isLogin ? "Sign Up" : "Sign In"}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 2,
    textShadowColor: 'rgba(251, 191, 36, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  formContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  formCard: {
    padding: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  buttonContainer: {
    marginTop: 10,
    borderRadius: 16,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    marginTop: 10,
    borderRadius: 16,
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchTextMain: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  switchTextHighlight: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
});