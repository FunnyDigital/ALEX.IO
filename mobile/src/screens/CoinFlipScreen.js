import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { apiService } from '../config/api';
import { auth } from '../config/firebase';

const coinImage = require('../../assets/bitcoin.png');

export default function CoinFlipScreen() {
  const [bet, setBet] = useState('');
  const [choice, setChoice] = useState('heads');
  const [result, setResult] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState([]);
  const [flipAnimation] = useState(new Animated.Value(0));
  const [webMessage, setWebMessage] = useState('');

  // Fetch wallet balance on component mount
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await apiService.getWallet();
        setWallet(response.data);
      } catch (error) {
        console.log('Error fetching wallet:', error);
        if (error.code === 'ECONNABORTED') {
          Alert.alert('Error', 'Request timeout while fetching balance. Please check your connection.');
        }
      }
    };

    if (auth.currentUser) {
      fetchWallet();
    }
  }, []);

  const handleFlip = async () => {
    if (!bet || isNaN(bet) || bet <= 0) {
      if (Platform.OS === 'web') {
        setWebMessage('Please enter a valid bet amount');
      } else {
        Alert.alert('Error', 'Please enter a valid bet amount');
      }
      return;
    }

    // Check if user has sufficient balance
    if (wallet && parseFloat(bet) > wallet.balance) {
      const msg = `Your balance is $${wallet.balance.toFixed(2)} but you're trying to bet $${parseFloat(bet).toFixed(2)}. Please reduce your bet amount or add funds to your wallet.`;
      if (Platform.OS === 'web') {
        setWebMessage(msg);
      } else {
        Alert.alert('Insufficient Balance', msg, [{ text: 'OK' }]);
      }
      return;
    }

    setSpinning(true);
    setLoading(true);
    setResult(null);

    // Start animation
    Animated.sequence([
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(flipAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // Keep animation delay for UX; actual result comes from server
      setTimeout(() => {
        handlePlay();
      }, 1000);
    } catch (err) {
      if (Platform.OS === 'web') {
        setWebMessage('Failed to flip coin');
      } else {
        Alert.alert('Error', 'Failed to flip coin');
      }
      setLoading(false);
      setSpinning(false);
    }
  };

  const handlePlay = async () => {
    console.log('handlePlay started');
    console.log('User authenticated:', !!auth.currentUser);
    console.log('Bet amount:', bet, 'Choice:', choice);
    try {
      const res = await apiService.coinFlip(parseFloat(bet), choice);
      console.log('API response:', res.data);

      if (res.data?.success) {
        const { result, win, wallet } = res.data;
        console.log('Game result:', { result, win, wallet });
        setResult(result);
        setWallet({ balance: wallet });
        setHistory([
          {
            time: new Date().toLocaleTimeString(),
            choice,
            result,
            win,
            wallet: { balance: wallet },
          },
          ...history.slice(0, 4),
        ]);

        // Always fetch the latest wallet from backend after game result
        try {
          const walletRes = await apiService.getWallet();
          if (walletRes.data && typeof walletRes.data.balance !== 'undefined') {
            setWallet(walletRes.data);
          }
        } catch (walletErr) {
          console.error('Error fetching updated wallet:', walletErr);
        }

        if (win) {
          if (Platform.OS === 'web') {
            setWebMessage(`🎉 You Won! You won ₦${bet}! New balance: ₦${wallet.toLocaleString()}`);
          } else {
            Alert.alert('🎉 You Won!', `You won ₦${bet}! New balance: ₦${wallet.toLocaleString()}`);
          }
        } else {
          if (Platform.OS === 'web') {
            setWebMessage(`😔 You Lost. You lost ₦${bet}. Balance: ₦${wallet.toLocaleString()}`);
          } else {
            Alert.alert('😔 You Lost', `You lost ₦${bet}. Balance: ₦${wallet.toLocaleString()}`);
          }
        }
      } else {
        console.log('API returned error:', res.data);
        if (Platform.OS === 'web') {
          setWebMessage(res.data?.message || 'Failed to place bet');
        } else {
          Alert.alert('Error', res.data?.message || 'Failed to place bet');
        }
      }
    } catch (err) {
      console.error('Coin flip error:', err);
      let msg = 'Network error. Please check your connection.';
      if (err.code === 'ECONNABORTED') {
        msg = 'Request timeout. Please try again.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      if (Platform.OS === 'web') {
        setWebMessage(msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      console.log('handlePlay completed');
      setLoading(false);
      setSpinning(false);
    }
  };

  const spin = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.gameCard}>
        {/* Web error/result message */}
        {Platform.OS === 'web' && webMessage && (
          <View style={{ marginBottom: 10, backgroundColor: '#222', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: '#FFD700', textAlign: 'center' }}>{webMessage}</Text>
          </View>
        )}
        <Text style={styles.title}>Coin Flip Challenge</Text>
        
        {/* Coin Animation */}
        <View style={styles.coinContainer}>
          <Animated.View
            style={[
              styles.coin,
              {
                transform: [{ rotateY: spin }],
              },
            ]}
          >
            <Image source={coinImage} style={styles.coinImage} />
          </Animated.View>
        </View>

        {/* Bet Input */}
        <TextInput
          style={styles.input}
          placeholder="Enter bet amount"
          placeholderTextColor="#666"
          value={bet}
          onChangeText={setBet}
          keyboardType="numeric"
        />

        {/* Choice Buttons */}
        <View style={styles.choiceContainer}>
          <TouchableOpacity
            style={[
              styles.choiceButton,
              choice === 'heads' && styles.choiceButtonSelected,
            ]}
            onPress={() => setChoice('heads')}
          >
            <Text
              style={[
                styles.choiceButtonText,
                choice === 'heads' && styles.choiceButtonTextSelected,
              ]}
            >
              Heads
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.choiceButton,
              choice === 'tails' && styles.choiceButtonSelected,
            ]}
            onPress={() => setChoice('tails')}
          >
            <Text
              style={[
                styles.choiceButtonText,
                choice === 'tails' && styles.choiceButtonTextSelected,
              ]}
            >
              Tails
            </Text>
          </TouchableOpacity>
        </View>

        {/* Flip Button */}
        <TouchableOpacity
          style={[styles.flipButton, loading && styles.flipButtonDisabled]}
          onPress={handleFlip}
          disabled={loading}
        >
          <Text style={styles.flipButtonText}>
            {loading ? 'Flipping...' : 'Flip Coin'}
          </Text>
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>
              Result: {result.charAt(0).toUpperCase() + result.slice(1)}
            </Text>
            {wallet !== null && (
              <Text style={styles.balanceText}>
                Balance: ${typeof wallet === 'object' && wallet.balance !== undefined 
                  ? wallet.balance.toFixed(2) 
                  : wallet.toLocaleString()}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* History */}
      {history.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Recent Games</Text>
          {history.map((game, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyTime}>{game.time}</Text>
              <Text style={styles.historyChoice}>
                Chose: {game.choice} | Result: {game.result}
              </Text>
              <Text style={[
                styles.historyResult,
                { color: game.win ? '#4CAF50' : '#FF6B6B' }
              ]}>
                {game.win ? 'WON' : 'LOST'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  gameCard: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
    textAlign: 'center',
  },
  coinContainer: {
    marginBottom: 30,
  },
  coin: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  coinImage: {
    width: '80%',
    height: '80%',
    borderRadius: 48,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#0e4b99',
    width: '100%',
    textAlign: 'center',
  },
  choiceContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
  },
  choiceButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0e4b99',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
  },
  choiceButtonSelected: {
    backgroundColor: '#FFD700',
  },
  choiceButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  choiceButtonTextSelected: {
    color: '#000',
  },
  flipButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    marginBottom: 20,
  },
  flipButtonDisabled: {
    backgroundColor: '#999',
  },
  flipButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  balanceText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  historyCard: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    padding: 20,
    borderRadius: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
    textAlign: 'center',
  },
  historyItem: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  historyTime: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 5,
  },
  historyChoice: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
  },
  historyResult: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});