import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const games = [
  { name: 'Coin Flip', icon: '🪙', route: 'CoinFlip' },
  { name: 'Dice Roll', icon: '🎲', route: 'DiceRoll' },
  { name: 'Trade Gamble', icon: '📈', route: 'TradeGamble' },
  { name: 'Flappy Bird', icon: '🐦', route: 'FlappyBird' },
];

export default function GamesScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

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
    navigation.navigate(route);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.heroSection}>
        <Text style={styles.title}>ALEX.IO GAMES</Text>
        <Text style={styles.subtitle}>Choose your game and win big!</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceAmount}>₦{balance.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.gamesGrid}>
        {games.map((game) => (
          <TouchableOpacity
            key={game.name}
            style={styles.gameCard}
            onPress={() => handlePlay(game.route)}
          >
            <Text style={styles.gameIcon}>{game.icon}</Text>
            <Text style={styles.gameName}>{game.name}</Text>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => handlePlay(game.route)}
            >
              <Text style={styles.playButtonText}>Play Now</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  heroSection: {
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  balanceContainer: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 20,
  },
  gameCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    margin: 10,
    width: '42%',
    minHeight: 180,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gameIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
    textAlign: 'center',
  },
  playButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  playButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});