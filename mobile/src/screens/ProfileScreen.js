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
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

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
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Header Profile Card */}
            <View style={styles.headerCardWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                style={styles.headerCard}
              >
                <View style={styles.profileIconContainer}>
                  <Text style={styles.profileIcon}>👤</Text>
                </View>
                <Text style={styles.welcomeText}>Welcome back!</Text>
                <Text style={styles.usernameText}>{profile?.username || 'User'}</Text>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Text style={styles.statIcon}>💰</Text>
                    <Text style={styles.statValue}>₦{profile?.wallet?.toLocaleString() || '0'}</Text>
                    <Text style={styles.statLabel}>Balance</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statIcon}>🎮</Text>
                    <Text style={styles.statValue}>{profile?.gamesPlayed || '0'}</Text>
                    <Text style={styles.statLabel}>Played</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statIcon}>🏆</Text>
                    <Text style={styles.statValue}>{profile?.wins || '0'}</Text>
                    <Text style={styles.statLabel}>Wins</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Personal Information Section */}
            <View style={styles.sectionWrapper}>
              <LinearGradient colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>👤 Personal Information</Text>
                  <TouchableOpacity style={styles.editButton} onPress={() => setEditing(!editing)}>
                    <Text style={styles.editButtonText}>{editing ? '❌ CANCEL' : '✏️ EDIT'}</Text>
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
                      placeholderTextColor="#64748b"
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
                      placeholderTextColor="#64748b"
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
                  placeholderTextColor="#64748b"
                />

                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, !editing && styles.inputDisabled]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  editable={editing}
                  placeholder="Enter email address"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, !editing && styles.inputDisabled]}
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                  editable={editing}
                  placeholder="Enter phone number"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                />
              </LinearGradient>
            </View>

            {/* Bank Account Section */}
            <View style={styles.sectionWrapper}>
              <LinearGradient colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🏦 Withdrawal Details</Text>
                  <View style={styles.verificationBadge}>
                    <Text style={styles.verificationText}>
                      {formData.accountNumber && formData.bankCode ? '✅ ADDED' : '⚠️ REQUIRED'}
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
                  placeholderTextColor="#64748b"
                />

                <Text style={styles.label}>Account Number</Text>
                <TextInput
                  style={[styles.input, !editing && styles.inputDisabled]}
                  value={formData.accountNumber}
                  onChangeText={(text) => setFormData({ ...formData, accountNumber: text })}
                  editable={editing}
                  placeholder="Enter 10-digit account number"
                  placeholderTextColor="#64748b"
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
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                />

                <View style={styles.infoBox}>
                  <Text style={styles.infoIcon}>ℹ️</Text>
                  <Text style={styles.infoText}>
                    Bank code is required for withdrawals. Common codes: GTBank (011), First Bank (011), Access Bank (044), UBA (033)
                  </Text>
                </View>

                {editing && (
                  <TouchableOpacity style={styles.saveButtonWrapper} onPress={handleSave}>
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      style={styles.saveButton}
                      start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                    >
                      <Text style={styles.saveButtonIcon}>💾</Text>
                      <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>

            {/* Account Actions Section */}
            <View style={styles.sectionWrapper}>
              <LinearGradient colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']} style={styles.section}>
                <Text style={[styles.sectionTitle, {marginBottom: 20}]}>⚙️ Account Actions</Text>
                
                <TouchableOpacity onPress={() => navigation.navigate('Wallet')} style={styles.actionButtonWrapper}>
                   <LinearGradient colors={['rgba(15,23,42,0.6)', 'rgba(15,23,42,0.6)']} style={styles.actionButton}>
                    <Text style={styles.actionButtonIcon}>💳</Text>
                    <Text style={styles.actionButtonText}>Manage Wallet</Text>
                    <Text style={styles.actionButtonArrow}>→</Text>
                   </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLogout} style={styles.actionButtonWrapper}>
                   <LinearGradient colors={['rgba(244,63,94,0.1)', 'rgba(225,29,72,0.1)']} style={[styles.actionButton, {borderColor: 'rgba(244,63,94,0.3)'}]}>
                    <Text style={styles.actionButtonIcon}>🚪</Text>
                    <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
                    <Text style={[styles.actionButtonArrow, styles.logoutText]}>→</Text>
                   </LinearGradient>
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
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 100 : 50 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  
  headerCardWrapper: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10,
    marginBottom: 24, marginTop: 10,
  },
  headerCard: {
    padding: 30, borderRadius: 32, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  profileIconContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(244,63,94,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)'
  },
  profileIcon: { fontSize: 40 },
  welcomeText: { fontSize: 14, color: '#94a3b8', marginBottom: 8, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  usernameText: { fontSize: 24, fontWeight: '900', color: '#f8fafc', marginBottom: 24, letterSpacing: 1 },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', padding: 16, borderRadius: 20,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: '900', color: '#f43f5e', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 0.5 },

  sectionWrapper: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8,
    marginBottom: 24,
  },
  section: {
    padding: 24, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', letterSpacing: 0.5 },
  sectionDescription: { fontSize: 13, color: '#94a3b8', marginBottom: 20, lineHeight: 20 },
  
  editButton: { backgroundColor: 'rgba(56,189,248,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)' },
  editButtonText: { color: '#38bdf8', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  
  verificationBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  verificationText: { fontSize: 11, color: '#10b981', fontWeight: '900', letterSpacing: 1 },

  inputRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  halfInput: { flex: 1 },
  label: { fontSize: 12, color: '#94a3b8', marginBottom: 8, marginTop: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  input: {
    backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: 16, padding: 18, fontSize: 16, color: '#f8fafc',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  inputDisabled: { opacity: 0.5, backgroundColor: 'rgba(0,0,0,0.2)' },

  infoBox: { flexDirection: 'row', backgroundColor: 'rgba(56,189,248,0.1)', padding: 16, borderRadius: 16, marginTop: 24, borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)' },
  infoIcon: { fontSize: 18, marginRight: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#38bdf8', lineHeight: 20 },

  saveButtonWrapper: { marginTop: 24, borderRadius: 16, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  saveButton: { paddingVertical: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  saveButtonIcon: { fontSize: 18, marginRight: 8 },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  actionButtonWrapper: { marginBottom: 16, borderRadius: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  actionButtonIcon: { fontSize: 20, marginRight: 16 },
  actionButtonText: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold', flex: 1 },
  actionButtonArrow: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold' },
  logoutText: { color: '#f43f5e' },
});