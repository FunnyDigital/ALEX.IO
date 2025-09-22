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
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { apiService } from '../config/api';

export default function WalletScreen() {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({ account_number: '', bank_code: '' });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid withdrawal amount');
      return;
    }

    try {
      const res = await apiService.withdrawWallet(Number(withdrawAmount));
      
      if (res.data?.wallet !== undefined) {
        setWithdrawAmount('');
        Alert.alert('Success', 'Withdrawal successful!');
      } else {
        Alert.alert('Error', res.data?.message || 'Withdrawal failed');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Withdrawal failed. Please try again.');
    }
  };

  const handleDeposit = () => {
    Alert.alert('Deposit', 'Deposit functionality will be implemented with Paystack integration');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>₦{profile?.wallet?.toLocaleString() || '0'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deposit Money</Text>
        <TouchableOpacity style={styles.depositButton} onPress={handleDeposit}>
          <Text style={styles.depositButtonText}>Deposit with Paystack</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Withdraw Money</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Withdrawal Amount"
          placeholderTextColor="#666"
          value={withdrawAmount}
          onChangeText={setWithdrawAmount}
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Bank Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Account Number"
          placeholderTextColor="#666"
          value={bankDetails.account_number}
          onChangeText={(text) => setBankDetails({...bankDetails, account_number: text})}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Bank Code"
          placeholderTextColor="#666"
          value={bankDetails.bank_code}
          onChangeText={(text) => setBankDetails({...bankDetails, bank_code: text})}
        />

        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={handleWithdraw}
        >
          <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <View style={styles.historyPlaceholder}>
          <Text style={styles.historyText}>Transaction history will be displayed here</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  balanceCard: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  section: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    padding: 20,
    borderRadius: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#0e4b99',
  },
  inputLabel: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
    marginTop: 10,
  },
  depositButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  depositButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  withdrawButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyPlaceholder: {
    padding: 20,
    alignItems: 'center',
  },
  historyText: {
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
  },
});