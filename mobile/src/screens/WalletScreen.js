import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { apiService } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient';

// Conditionally import Paystack only for mobile
let Paystack = null;
if (Platform.OS !== 'web') {
  try {
    const PaystackModule = require('react-native-paystack-webview');
    Paystack = PaystackModule.Paystack;
  } catch (error) {
    console.log('Paystack not available for this platform');
  }
}

export default function WalletScreen() {
  const [depositAmount, setDepositAmount] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaystack, setShowPaystack] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);

  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Use Firestore onSnapshot for live balance updates
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setProfile(data);
          }
        });
        setLoading(false);
        return unsubscribe;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe;
    fetchProfile().then((unsub) => {
      if (unsub) unsubscribe = unsub;
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDeposit = () => {
    if (!depositAmount || isNaN(depositAmount) || Number(depositAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid deposit amount');
      return;
    }

    if (Number(depositAmount) < 100) {
      Alert.alert('Error', 'Minimum deposit amount is ₦100');
      return;
    }

    if (Platform.OS === 'web') {
      // For web, open Paystack payment page directly
      handleWebPayment();
    } else if (Paystack) {
      // For mobile, use the WebView component
      setShowPaystack(true);
    } else {
      Alert.alert('Error', 'Payment not available on this platform');
    }
  };

  const handleDemoPayment = () => {
    Alert.alert(
      'Demo Payment Mode',
      `This will simulate a deposit of ₦${depositAmount}.\n\nTo use real Paystack:\n1. Go to your Paystack Dashboard\n2. Copy your Public Key (starts with pk_test_)\n3. Replace the key in the code\n\nProceed with demo?`,
      [
        { text: 'Cancel', onPress: () => setPaymentInProgress(false) },
        { text: 'Demo Deposit', onPress: () => {
          setPaymentInProgress(true);
          simulatePayment(`demo_${Date.now()}`);
        }}
      ]
    );
  };

  const handleWebPayment = async () => {
    try {
      setPaymentInProgress(true);
      
      // Generate a unique reference for this transaction
      const reference = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (typeof window !== 'undefined' && window.PaystackPop) {
        // Use Paystack Inline if available
        const handler = window.PaystackPop.setup({
          key: 'pk_test_019f033625483fdf933f93654941a531e6b14efc',
          email: auth.currentUser?.email || 'user@example.com',
          amount: Number(depositAmount) * 100,
          currency: 'NGN',
          ref: reference,
          callback: function(response) {
            console.log('Payment success:', response);
            handlePaymentSuccess(response);
          },
          onClose: function() {
            console.log('Payment cancelled');
            handlePaymentCancel();
          }
        });
        handler.openIframe();
      } else {
        // Fallback: Load Paystack script dynamically
        loadPaystackScript(() => {
          const handler = window.PaystackPop.setup({
            key: 'pk_test_019f033625483fdf933f93654941a531e6b14efc',
            email: auth.currentUser?.email || 'user@example.com',
            amount: Number(depositAmount) * 100,
            currency: 'NGN',
            ref: reference,
            callback: function(response) {
              console.log('Payment success:', response);
              handlePaymentSuccess(response);
            },
            onClose: function() {
              console.log('Payment cancelled');
              handlePaymentCancel();
            }
          });
          handler.openIframe();
        });
      }
      
    } catch (error) {
      console.error('Web payment error:', error);
      Alert.alert('Error', 'Failed to initialize payment');
      setPaymentInProgress(false);
    }
  };

  const loadPaystackScript = (callback) => {
    if (typeof window === 'undefined') return;
    
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = callback;
    script.onerror = () => {
      console.error('Failed to load Paystack script');
      // Fallback to demo mode
      Alert.alert(
        'Demo Payment',
        `Simulating deposit of ₦${depositAmount}.\n\nIn production, this would open Paystack payment.`,
        [
          { text: 'Cancel', onPress: () => setPaymentInProgress(false) },
          { text: 'Continue Demo', onPress: () => simulatePayment(`demo_${Date.now()}`) }
        ]
      );
    };
    document.head.appendChild(script);
  };

  const simulatePayment = (reference) => {
    // Simulate a successful payment for demo purposes
    setTimeout(() => {
      handlePaymentSuccess({ reference });
    }, 1000);
  };

  const handlePaymentSuccess = async (res) => {
    console.log('Payment successful:', res);
    setPaymentInProgress(true);
    setShowPaystack(false);

    try {
      // Call backend to verify payment and update wallet
      const response = await apiService.depositWallet(res.reference, Number(depositAmount));
      
      if (response.data?.success) {
        Alert.alert('Success', `₦${depositAmount} has been added to your wallet!`);
        setDepositAmount('');
      } else {
        Alert.alert('Error', response.data?.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Deposit verification error:', error);
      Alert.alert('Error', 'Failed to verify payment. Please contact support if money was deducted.');
    } finally {
      setPaymentInProgress(false);
    }
  };

  const handlePaymentCancel = () => {
    console.log('Payment cancelled');
    setShowPaystack(false);
    Alert.alert('Cancelled', 'Payment was cancelled');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>MY WALLET</Text>
              <Text style={styles.headerSubtitle}>Manage your funds</Text>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCardWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                style={styles.balanceCard}
              >
                <View style={styles.balanceHeader}>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                  <View style={styles.balanceIcon}>
                    <Text style={styles.balanceEmoji}>💰</Text>
                  </View>
                </View>
                <Text style={styles.balanceAmount}>
                  ₦{profile?.wallet?.toLocaleString() || '0.00'}
                </Text>
                <Text style={styles.balanceSubtext}>
                  Ready to use • Last updated now
                </Text>
              </LinearGradient>
            </View>

            {/* Deposit Section */}
            <View style={styles.sectionWrapper}>
              <LinearGradient colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>💳 Deposit Money</Text>
                  <Text style={styles.sectionDescription}>Add funds to your wallet securely</Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount to Deposit</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="₦ Enter amount (Minimum ₦100)"
                    placeholderTextColor="#64748b"
                    value={depositAmount}
                    onChangeText={setDepositAmount}
                    keyboardType="numeric"
                  />
                </View>
                
                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButtonWrapper, paymentInProgress && styles.buttonDisabled]} 
                    onPress={handleDeposit}
                    disabled={paymentInProgress}
                  >
                    <LinearGradient
                      colors={paymentInProgress ? ['#475569', '#334155'] : ['#10b981', '#059669']}
                      style={styles.actionButton}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                      <View style={styles.buttonContent}>
                        <Text style={styles.buttonIcon}>🚀</Text>
                        <Text style={styles.buttonText}>
                          {paymentInProgress ? 'PROCESSING...' : 'ADD MONEY'}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.securityNote}>
                  <Text style={styles.securityText}>🔐 Secured by Paystack • Your data is encrypted</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Transaction History */}
            <View style={styles.sectionWrapper}>
              <LinearGradient colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>📊 Recent Transactions</Text>
                  <Text style={styles.sectionDescription}>Your transaction history</Text>
                </View>
                <View style={styles.historyPlaceholder}>
                  <Text style={styles.historyIcon}>📝</Text>
                  <Text style={styles.historyTitle}>No transactions yet</Text>
                  <Text style={styles.historyText}>Your recent deposits will appear here</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Paystack Payment Modal - Mobile Only */}
            {Platform.OS !== 'web' && Paystack && (
              <Modal
                visible={showPaystack}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowPaystack(false)}
              >
                <Paystack
                  paystackKey="pk_test_019f033625483fdf933f93654941a531e6b14efc"
                  amount={depositAmount}
                  billingEmail={auth.currentUser?.email || 'user@example.com'}
                  billingMobile="08123456789"
                  billingName={auth.currentUser?.displayName || profile?.username || 'User'}
                  ActivityIndicatorColor="#f43f5e"
                  onCancel={handlePaymentCancel}
                  onSuccess={handlePaymentSuccess}
                  autoStart={true}
                />
              </Modal>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 100 : 50 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  
  header: { alignItems: 'center', marginBottom: 24, marginTop: 24 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#10b981', letterSpacing: 2, marginBottom: 8, textShadowColor: 'rgba(16,185,129,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 },
  headerSubtitle: { fontSize: 16, color: '#94a3b8', fontWeight: '600', letterSpacing: 1 },

  balanceCardWrapper: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10, marginBottom: 24 },
  balanceCard: { padding: 30, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  balanceLabel: { fontSize: 16, color: '#e2e8f0', fontWeight: 'bold', letterSpacing: 0.5 },
  balanceIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  balanceEmoji: { fontSize: 24 },
  balanceAmount: { fontSize: 40, fontWeight: '900', color: '#f8fafc', marginBottom: 8, letterSpacing: 1 },
  balanceSubtext: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },

  sectionWrapper: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8, marginBottom: 24 },
  section: { padding: 24, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', letterSpacing: 0.5, marginBottom: 4 },
  sectionDescription: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },

  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  input: {
    backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: 16, padding: 20, fontSize: 18, color: '#f8fafc',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },

  actionButtons: { alignItems: 'center', width: '100%' },
  actionButtonWrapper: { width: '100%', borderRadius: 16, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  actionButton: { paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonIcon: { fontSize: 20, marginRight: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  buttonDisabled: { opacity: 0.6 },

  securityNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  securityText: { fontSize: 12, color: '#64748b', textAlign: 'center', fontWeight: '600' },

  historyPlaceholder: { alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(15,23,42,0.4)', borderRadius: 20 },
  historyIcon: { fontSize: 40, marginBottom: 16, opacity: 0.8 },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 8, letterSpacing: 0.5 },
  historyText: { color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});