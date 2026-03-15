import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const games = [
  { name: 'Coin Flip', icon: '🪙', route: 'CoinFlip', color1: '#FFD700', color2: '#FFA500' },
  { name: 'Dice Roll', icon: '🎲', route: 'DiceRoll', color1: '#FF416C', color2: '#FF4B2B' },
  { name: 'Trade Gamble', icon: '📈', route: 'TradeGamble', color1: '#00B4DB', color2: '#0083B0' },
  { name: 'Flappy Bird', icon: '🐦', route: 'FlappyBird', color1: '#11998e', color2: '#38ef7d' },
];

export default function GamesScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [scaleValue] = useState(new Animated.Value(1));

  const fetchBalance = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setBalance(userDoc.data().wallet || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBalance();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handlePlay = (route) => {
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start(() => navigation.navigate(route));
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fbbf24" />
        }
      >
        <View style={styles.heroSection}>
          <Text style={styles.title}>ALEX.IO GAMES</Text>
          <Text style={styles.subtitle}>Choose your game and win big!</Text>

          <LinearGradient
            colors={['rgba(251, 191, 36, 0.15)', 'rgba(251, 191, 36, 0.05)']}
            style={styles.balanceContainer}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <View style={styles.walletIcon}><Text style={styles.walletEmoji}>🎒</Text></View>
            </View>
            <Text style={styles.balanceAmount}>₦{balance.toLocaleString()}</Text>
          </LinearGradient>
        </View>

        <View style={styles.gamesGrid}>
          {games.map((game) => (
            <TouchableOpacity
              key={game.name}
              style={styles.gameCardWrapper}
              onPress={() => handlePlay(game.route)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                style={styles.gameCard}
              >
                <LinearGradient
                  colors={[game.color1, game.color2]}
                  style={styles.iconContainer}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.gameIcon}>{game.icon}</Text>
                </LinearGradient>
                <Text style={styles.gameName}>{game.name}</Text>
                <View style={styles.playButton}>
                  <Text style={styles.playButtonText}>Play Now</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
    textShadowColor: 'rgba(251, 191, 36, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  balanceContainer: {
    padding: 20,
    borderRadius: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  walletIcon: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    padding: 8,
    borderRadius: 12,
  },
  walletEmoji: {
    fontSize: 16,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f8fafc',
    letterSpacing: 1,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
    marginTop: 10,
  },
  gameCardWrapper: {
    width: '47%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  gameCard: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    minHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  gameIcon: {
    fontSize: 32,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  playButton: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  playButtonText: {
    color: '#fbbf24',
    fontWeight: 'bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});