import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { apiService } from '../config/api';
import { auth } from '../config/firebase';

const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function DiceRollScreen() {
  const [bet, setBet] = useState('');
  const [guess, setGuess] = useState(1);
  const [result, setResult] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [rollAnimation] = useState(new Animated.Value(0));

  const handlePlay = async () => {
    if (!bet || isNaN(bet) || bet <= 0) {
      Alert.alert('Error', 'Please enter a valid bet amount');
      return;
    }

    setLoading(true);
    setRolling(true);
    setResult(null);

    // Start rolling animation
    Animated.loop(
      Animated.timing(rollAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      { iterations: 15 }
    ).start();

    try {
      // Simulate dice roll animation
      setTimeout(async () => {
        try {
          const res = await apiService.diceRoll(Number(bet), Number(guess));
          
          setResult(res.data.result);
          setWallet(res.data.wallet);
          
          if (res.data.result === guess) {
            Alert.alert('🎉 You Won!', `You guessed correctly! Won ₦${bet * 5}!`);
          } else {
            Alert.alert('😔 You Lost', `The dice showed ${res.data.result}. Better luck next time!`);
          }
          
          setRolling(false);
          rollAnimation.setValue(0);
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || err.message || 'Error');
          setRolling(false);
          rollAnimation.setValue(0);
        }
        setLoading(false);
      }, 1500);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Error');
      setLoading(false);
      setRolling(false);
      rollAnimation.setValue(0);
    }
  };

  const rollRotation = rollAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.gameCard}>
        <Text style={styles.title}>Dice Roll Challenge</Text>
        <Text style={styles.subtitle}>Guess the number (1-6) and win 5x your bet!</Text>
        
        {/* Dice Display */}
        <View style={styles.diceContainer}>
          <Animated.View
            style={[
              styles.dice,
              rolling && {
                transform: [{ rotate: rollRotation }],
              },
            ]}
          >
            <Text style={styles.diceText}>
              {rolling ? diceEmojis[Math.floor(Math.random() * 6)] : 
               result ? diceEmojis[result - 1] : diceEmojis[guess - 1]}
            </Text>
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

        {/* Number Selection */}
        <Text style={styles.sectionTitle}>Choose your guess:</Text>
        <View style={styles.numbersContainer}>
          {[1, 2, 3, 4, 5, 6].map((number) => (
            <TouchableOpacity
              key={number}
              style={[
                styles.numberButton,
                guess === number && styles.numberButtonSelected,
              ]}
              onPress={() => setGuess(number)}
            >
              <Text style={styles.numberEmoji}>{diceEmojis[number - 1]}</Text>
              <Text
                style={[
                  styles.numberText,
                  guess === number && styles.numberTextSelected,
                ]}
              >
                {number}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Roll Button */}
        <TouchableOpacity
          style={[styles.rollButton, loading && styles.rollButtonDisabled]}
          onPress={handlePlay}
          disabled={loading}
        >
          <Text style={styles.rollButtonText}>
            {loading ? 'Rolling...' : 'Roll Dice'}
          </Text>
        </TouchableOpacity>

        {/* Result */}
        {result && !rolling && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>
              Dice Result: {result}
            </Text>
            <Text style={[
              styles.outcomeText,
              { color: result === guess ? '#4CAF50' : '#FF6B6B' }
            ]}>
              {result === guess ? 'YOU WON!' : 'YOU LOST'}
            </Text>
            {wallet !== null && (
              <Text style={styles.balanceText}>Balance: ₦{wallet.toLocaleString()}</Text>
            )}
          </View>
        )}
      </View>

      {/* Game Rules */}
      <View style={styles.rulesCard}>
        <Text style={styles.rulesTitle}>Game Rules</Text>
        <Text style={styles.rulesText}>• Choose a number between 1 and 6</Text>
        <Text style={styles.rulesText}>• Place your bet</Text>
        <Text style={styles.rulesText}>• If you guess correctly, win 5x your bet!</Text>
        <Text style={styles.rulesText}>• If you guess wrong, lose your bet</Text>
      </View>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  diceContainer: {
    marginBottom: 30,
  },
  dice: {
    width: 120,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 20,
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
  diceText: {
    fontSize: 60,
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
  sectionTitle: {
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  numbersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  numberButton: {
    width: '15%',
    aspectRatio: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0e4b99',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  numberButtonSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  numberEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  numberText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  numberTextSelected: {
    color: '#000',
  },
  rollButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    marginBottom: 20,
  },
  rollButtonDisabled: {
    backgroundColor: '#999',
  },
  rollButtonText: {
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
  outcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  rulesCard: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    padding: 20,
    borderRadius: 15,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  rulesText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
});