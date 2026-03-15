import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await apiService.getWallet();
        setWallet(response.data);
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          Alert.alert('Error', 'Request timeout while fetching balance.');
        }
      }
    };
    if (auth.currentUser) fetchWallet();
  }, []);

  const handlePlay = async () => {
    if (!bet || isNaN(bet) || bet <= 0) {
      Alert.alert('Error', 'Please enter a valid bet amount');
      return;
    }

    if (wallet && parseFloat(bet) > wallet.balance) {
      Alert.alert(
        'Insufficient Balance',
        `Your balance is ₦${wallet.balance.toFixed(2)} but you're trying to bet ₦${parseFloat(bet).toFixed(2)}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    setRolling(true);
    setResult(null);

    Animated.loop(
      Animated.timing(rollAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      { iterations: 12 }
    ).start();

    try {
      setTimeout(async () => {
        try {
          const res = await apiService.diceRoll(Number(bet), Number(guess));
          if (res.data?.success) {
            const { result, win, profit, wallet } = res.data;
            setResult(result);
            setWallet({ balance: wallet });

            try {
              const walletRes = await apiService.getWallet();
              if (walletRes.data && typeof walletRes.data.balance !== 'undefined') {
                setWallet(walletRes.data);
              }
            } catch (err) {}

            if (win) {
              const formattedProfit = profit ? profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (bet * 5).toString();
              if (Platform.OS === 'web') alert(`🎉 You Won!\nGuessed correctly! Profit: ₦${formattedProfit} (Total payout: ₦${(parseFloat(bet) + profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`);
              else Alert.alert('🎉 You Won!', `Guessed correctly! Profit: ₦${formattedProfit}! Balance: ₦${wallet.toLocaleString()}`);
            } else {
              if (Platform.OS === 'web') alert(`😔 You Lost\nDice showed ${result}. Lost ₦${bet}`);
              else Alert.alert('😔 You Lost', `Dice showed ${result}. Lost ₦${bet}. Balance: ₦${wallet.toLocaleString()}`);
            }
          } else {
            Alert.alert('Error', res.data?.message || 'Failed to place bet');
          }
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Network error.');
        } finally {
          setLoading(false);
          setRolling(false);
          rollAnimation.setValue(0);
        }
      }, 1800);
    } catch (err) {
      Alert.alert('Error', 'Something went wrong');
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
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Custom Back Button */}
            <TouchableOpacity 
              style={styles.backButtonFloating} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← BACK</Text>
            </TouchableOpacity>

            <View style={styles.gameCardWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                style={styles.gameCard}
              >
                <Text style={styles.title}>DICE ROLL</Text>
                <Text style={styles.subtitle}>Win big! (~4.9x your bet!)</Text>
                
                <View style={styles.diceContainer}>
                  <Animated.View
                    style={[
                      styles.dice,
                      rolling && { transform: [{ rotate: rollRotation }, { scale: 1.1 }] }
                    ]}
                  >
                    <Text style={styles.diceText}>
                      {rolling ? diceEmojis[Math.floor(Math.random() * 6)] : 
                       result ? diceEmojis[result - 1] : diceEmojis[guess - 1]}
                    </Text>
                  </Animated.View>
                </View>

                <View style={styles.balanceTag}>
                  <Text style={styles.balanceText}>
                    Balance: ₦{wallet ? wallet.balance?.toFixed(2) : '0.00'}
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Bet Amount</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#64748b"
                    value={bet}
                    onChangeText={setBet}
                    keyboardType="numeric"
                  />
                </View>

                <Text style={styles.ruleLabel}>Select your guess (1-6):</Text>
                <View style={styles.numbersContainer}>
                  {[1, 2, 3, 4, 5, 6].map((number) => (
                    <TouchableOpacity
                      key={number}
                      style={[styles.numberButton, guess === number && styles.numberButtonSelected]}
                      onPress={() => setGuess(number)}
                    >
                      <Text style={styles.numberEmoji}>{diceEmojis[number - 1]}</Text>
                      <Text style={[styles.numberText, guess === number && styles.numberTextSelected]}>
                        {number}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={loading || rolling ? styles.rollButtonDisabled : styles.buttonContainer}
                  onPress={handlePlay}
                  disabled={loading || rolling}
                >
                  <LinearGradient
                    colors={loading || rolling ? ['#475569', '#334155'] : ['#f43f5e', '#e11d48']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.rollButtonText}>{loading || rolling ? 'ROLLING...' : 'ROLL DICE'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {result && !rolling && (
                  <View style={[styles.resultBox, { borderColor: result === guess ? 'rgba(52,211,153,0.5)' : 'rgba(248,113,113,0.5)' }]}>
                    <Text style={styles.resultTitle}>Result: {result}</Text>
                    <Text style={[styles.outcomeText, { color: result === guess ? '#34d399' : '#f87171' }]}>
                      {result === guess ? 'YOU WON!' : 'YOU LOST'}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            <View style={styles.historyWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                style={styles.historyCard}
              >
                <Text style={styles.historyTitle}>Game Rules</Text>
                <Text style={styles.rulesText}>• Choose a number between 1 and 6</Text>
                <Text style={styles.rulesText}>• Place your bet</Text>
                <Text style={styles.rulesText}>• If you guess correctly, win 5x your bet!</Text>
                <Text style={styles.rulesText}>• If you guess wrong, lose your bet</Text>
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
  backButtonFloating: { marginVertical: 10, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  backButtonText: { color: '#94a3b8', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  gameCardWrapper: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4, shadowRadius: 30, elevation: 20, marginBottom: 30, marginTop: 20,
  },
  gameCard: {
    borderRadius: 32, padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 28, fontWeight: '900', color: '#f43f5e', letterSpacing: 3,
    marginBottom: 5, textShadowColor: 'rgba(244,63,94,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10,
  },
  subtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 24, fontWeight: '600', letterSpacing: 1 },
  diceContainer: { marginBottom: 30 },
  dice: {
    width: 140, height: 140, backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f43f5e', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 15,
    borderWidth: 2, borderColor: '#fff'
  },
  diceText: { fontSize: 80, color: '#0f172a' },
  balanceTag: {
    backgroundColor: 'rgba(244,63,94,0.1)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)',
  },
  balanceText: { color: '#f43f5e', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  inputContainer: { width: '100%', marginBottom: 20 },
  inputLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 16, padding: 20, fontSize: 18, color: '#f8fafc',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', textAlign: 'center', fontWeight: 'bold',
  },
  ruleLabel: { alignSelf: 'flex-start', color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  numbersContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: 24 },
  numberButton: {
    width: '30%', backgroundColor: 'rgba(15,23,42,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 15, alignItems: 'center', marginBottom: 12,
  },
  numberButtonSelected: { backgroundColor: 'rgba(244,63,94,0.2)', borderColor: '#f43f5e' },
  numberEmoji: { fontSize: 24, marginBottom: 4, color: '#f8fafc' },
  numberText: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold' },
  numberTextSelected: { color: '#f43f5e' },
  buttonContainer: { width: '100%', borderRadius: 16, shadowColor: '#f43f5e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  rollButtonDisabled: { width: '100%', borderRadius: 16, opacity: 0.7 },
  buttonGradient: { paddingVertical: 20, borderRadius: 16, alignItems: 'center' },
  rollButtonText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  resultBox: { marginTop: 24, padding: 15, backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 16, width: '100%', alignItems: 'center', borderWidth: 1 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', letterSpacing: 1, marginBottom: 4 },
  outcomeText: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  historyWrapper: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
  historyCard: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#94a3b8', marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' },
  rulesText: { fontSize: 14, color: '#cbd5e1', marginBottom: 8, lineHeight: 22 },
});