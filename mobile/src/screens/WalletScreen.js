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
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { apiService } from '../config/api';

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <Text style={styles.headerSubtitle}>Manage your funds</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
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
      </View>

      {/* Deposit Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💳 Deposit Money</Text>
          <Text style={styles.sectionDescription}>Add funds to your wallet securely</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Amount to Deposit</Text>
          <TextInput
            style={styles.input}
            placeholder="₦ Enter amount (Minimum ₦100)"
            placeholderTextColor="#666"
            value={depositAmount}
            onChangeText={setDepositAmount}
            keyboardType="numeric"
          />
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.addMoneyButton, paymentInProgress && styles.buttonDisabled]} 
            onPress={handleDeposit}
            disabled={paymentInProgress}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>💰</Text>
              <Text style={styles.buttonText}>
                {paymentInProgress ? 'Processing...' : 'Add Money'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>🔐 Secured by Paystack • Your data is encrypted</Text>
        </View>
      </View>

      {/* Transaction History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📊 Recent Transactions</Text>
          <Text style={styles.sectionDescription}>Your transaction history</Text>
        </View>
        <View style={styles.historyPlaceholder}>
          <Text style={styles.historyIcon}>📝</Text>
          <Text style={styles.historyTitle}>No transactions yet</Text>
          <Text style={styles.historyText}>Your recent deposits will appear here</Text>
        </View>
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
            ActivityIndicatorColor="#4CAF50"
            onCancel={handlePaymentCancel}
            onSuccess={handlePaymentSuccess}
            autoStart={true}
          />
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceCard: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  balanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceEmoji: {
    fontSize: 20,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  balanceSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 15,
  },
  actionButtons: {
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    height: 65,
    minWidth: 200,
  },
  addMoneyButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
  addMoneyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quickActionDeposit: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionEmoji: {
    fontSize: 18,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    color: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444',
    minHeight: 60,
    textAlign: 'left',
  },
  depositButton: {
    backgroundColor: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  buttonIcon: {
    fontSize: 16,
    marginRight: 6,
    lineHeight: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  depositButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#555',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 15,
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
  securityNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  securityText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  historyPlaceholder: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  historyIcon: {
    fontSize: 48,
    marginBottom: 15,
    opacity: 0.5,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  historyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});