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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Platform } from 'react-native';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    accountNumber: '',
    bankCode: '',
    bankName: '',
  });

  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile(data);
          setFormData({
            username: data.username || '',
            email: data.email || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phoneNumber: data.phoneNumber || '',
            accountNumber: data.accountNumber || '',
            bankCode: data.bankCode || '',
            bankName: data.bankName || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      const userRef = doc(db, 'users', user.uid);
      
      await updateDoc(userRef, {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        accountNumber: formData.accountNumber,
        bankCode: formData.bankCode,
        bankName: formData.bankName,
      });
      
      setProfile({ ...profile, ...formData });
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Error updating profile:', error);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      // On web, Alert.alert does nothing, so log out immediately
      try {
        await signOut(auth);
        navigation.replace('Auth');
      } catch (error) {
        // Optionally show a message in the UI
        console.error('Failed to logout', error);
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut(auth);
                navigation.replace('Auth');
              } catch (error) {
                Alert.alert('Error', 'Failed to logout');
              }
            },
          },
        ]
      );
    }
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
      {/* Header Profile Card */}
      <View style={styles.headerCard}>
        <View style={styles.profileIconContainer}>
          <Text style={styles.profileIcon}>👤</Text>
        </View>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.usernameText}>{profile?.username || 'User'}</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>₦{profile?.wallet?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabel}>Wallet Balance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎮</Text>
            <Text style={styles.statValue}>{profile?.gamesPlayed || '0'}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{profile?.wins || '0'}</Text>
            <Text style={styles.statLabel}>Total Wins</Text>
          </View>
        </View>
      </View>

      {/* Personal Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>👤 Personal Information</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(!editing)}
          >
            <Text style={styles.editButtonText}>
              {editing ? '❌ Cancel' : '✏️ Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              editable={editing}
              placeholder="Enter first name"
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              editable={editing}
              placeholder="Enter last name"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.username}
          onChangeText={(text) => setFormData({ ...formData, username: text })}
          editable={editing}
          placeholder="Enter username"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          editable={editing}
          placeholder="Enter email address"
          placeholderTextColor="#666"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.phoneNumber}
          onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
          editable={editing}
          placeholder="Enter phone number"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
        />
      </View>

      {/* Bank Account Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏦 Withdrawal Account Details</Text>
          <View style={styles.verificationBadge}>
            <Text style={styles.verificationText}>
              {formData.accountNumber && formData.bankCode ? '✅ Added' : '⚠️ Required'}
            </Text>
          </View>
        </View>
        <Text style={styles.sectionDescription}>
          Add your bank account details for withdrawals
        </Text>

        <Text style={styles.label}>Bank Name</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.bankName}
          onChangeText={(text) => setFormData({ ...formData, bankName: text })}
          editable={editing}
          placeholder="e.g., GTBank, First Bank, etc."
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Account Number</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.accountNumber}
          onChangeText={(text) => setFormData({ ...formData, accountNumber: text })}
          editable={editing}
          placeholder="Enter 10-digit account number"
          placeholderTextColor="#666"
          keyboardType="numeric"
          maxLength={10}
        />

        <Text style={styles.label}>Bank Code</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.bankCode}
          onChangeText={(text) => setFormData({ ...formData, bankCode: text })}
          editable={editing}
          placeholder="e.g., 011 for GTBank, 044 for Access Bank"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Bank code is required for withdrawals. Common codes: GTBank (011), First Bank (011), Access Bank (044), UBA (033)
          </Text>
        </View>

        {editing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonIcon}>💾</Text>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Account Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Account Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Text style={styles.actionButtonIcon}>💳</Text>
          <Text style={styles.actionButtonText}>Manage Wallet</Text>
          <Text style={styles.actionButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.actionButtonIcon}>🚪</Text>
          <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
            Logout
          </Text>
          <Text style={[styles.actionButtonArrow, styles.logoutButtonText]}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
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
  headerCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#1a1a2e',
    margin: 20,
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  profileIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileIcon: {
    fontSize: 40,
    color: '#FFD700',
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 25,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  section: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    lineHeight: 20,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  verificationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  verificationText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 8,
    marginTop: 15,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#2a2a3e',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  inputDisabled: {
    backgroundColor: '#1e1e2e',
    borderColor: '#333',
    opacity: 0.8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#FFA500',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  saveButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#2a2a3e',
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  actionButtonArrow: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  logoutButtonText: {
    color: '#fff',
  },
  bottomSpacer: {
    height: 30,
  },
});