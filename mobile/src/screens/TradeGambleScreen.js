import React from 'react';
import {
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TradeGambleScreen({ navigation }) {
  const handleComingSoon = () => {
    Alert.alert(
      'Coming Soon!',
      'Trade Gamble feature is under development and will be available in the next update.',
      [
        { text: 'OK' },
        { 
          text: 'Go Back', 
          onPress: () => navigation.goBack(),
          style: 'cancel' 
        }
      ]
    );
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
            style={styles.card}
          >
            <Text style={styles.title}>TRADE GAMBLE</Text>
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>📈</Text>
            </View>
            
            <Text style={styles.subtitle}>
              Predict the market, multiply your assets!
            </Text>
            
            <Text style={styles.description}>
              The ultimate trading arena where strategy meets luck. Bet on crypto movements and earn massive payouts instantly based on real-time market trends.
            </Text>

            <TouchableOpacity style={styles.primaryButton} onPress={handleComingSoon}>
              <LinearGradient
                colors={['#0ea5e9', '#0284c7']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>COMING SOON</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>GO BACK</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: { flex: 1, justifyContent: 'center', padding: 24 },
  cardWrapper: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4, shadowRadius: 30, elevation: 20,
  },
  card: {
    padding: 30,
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#38bdf8',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(56, 189, 248, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  emojiContainer: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    width: 120, height: 120,
    borderRadius: 60,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  emoji: {
    fontSize: 60,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0f2fe',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  primaryButton: {
    width: '100%', borderRadius: 16, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    marginBottom: 16,
  },
  buttonGradient: {
    paddingVertical: 18, borderRadius: 16, alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  backButton: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 18,
    width: '100%',
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
});