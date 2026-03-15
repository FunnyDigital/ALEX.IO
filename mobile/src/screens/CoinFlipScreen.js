import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  ScrollView,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  const handleFlip = async () => {
    if (!bet || isNaN(bet) || bet <= 0) {
      if (Platform.OS === 'web') setWebMessage('Please enter a valid bet amount');
      else Alert.alert('Error', 'Please enter a valid bet amount');
      return;
    }

    if (wallet && parseFloat(bet) > wallet.balance) {
      const msg = `Insufficient balance in your wallet.`;
      if (Platform.OS === 'web') setWebMessage(msg);
      else Alert.alert('Error', msg);
      return;
    }

    setSpinning(true);
    setLoading(true);
    setResult(null);

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
      setTimeout(() => {
        handlePlay();
      }, 1000);
    } catch (err) {
      if (Platform.OS === 'web') setWebMessage('Failed to flip coin');
      else Alert.alert('Error', 'Failed to flip coin');
      setLoading(false);
      setSpinning(false);
    }
  };

  const handlePlay = async () => {
    try {
      const res = await apiService.coinFlip(parseFloat(bet), choice);
      if (res.data?.success) {
        const { result, win, profit, wallet } = res.data;
        setResult(result);
        setWallet({ balance: wallet });
        setHistory([{
          time: new Date().toLocaleTimeString(),
          choice, result, win, profit, wallet: { balance: wallet },
        }, ...history.slice(0, 4)]);

        try {
          const walletRes = await apiService.getWallet();
          if (walletRes.data && typeof walletRes.data.balance !== 'undefined') {
            setWallet(walletRes.data);
          }
        } catch (walletErr) {}

        if (win) {
          const formattedProfit = profit ? profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : bet;
          if (Platform.OS === 'web') setWebMessage(`🎉 You Won ₦${formattedProfit}! (Total: ₦${(parseFloat(bet) + profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`);
          else Alert.alert('🎉 You Won!', `You won a profit of ₦${formattedProfit}! New balance: ₦${wallet.toLocaleString()}`);
        } else {
          if (Platform.OS === 'web') setWebMessage(`😔 You Lost ₦${bet}.`);
          else Alert.alert('😔 You Lost', `You lost ₦${bet}. Balance: ₦${wallet.toLocaleString()}`);
        }
      } else {
        if (Platform.OS === 'web') setWebMessage(res.data?.message || 'Failed to place bet');
        else Alert.alert('Error', res.data?.message || 'Failed to place bet');
      }
    } catch (err) {
      let msg = 'Network error. Please check your connection.';
      if (Platform.OS === 'web') setWebMessage(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  };

  const spin = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'],
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
                {Platform.OS === 'web' && webMessage && (
                  <View style={styles.webMessageBox}>
                    <Text style={styles.webMessageText}>{webMessage}</Text>
                  </View>
                )}

                <Text style={styles.title}>COIN FLIP</Text>
                
                <View style={styles.coinContainer}>
                  <Animated.View style={[styles.coin, { transform: [{ rotateY: spin }] }]}>
                    <Image source={coinImage} style={styles.coinImage} />
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

                <View style={styles.choiceContainer}>
                  <TouchableOpacity
                    style={[styles.choiceButton, choice === 'heads' && styles.choiceButtonSelected]}
                    onPress={() => setChoice('heads')}
                  >
                    <Text style={[styles.choiceButtonText, choice === 'heads' && styles.choiceButtonTextSelected]}>
                      Heads
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.choiceButton, choice === 'tails' && styles.choiceButtonSelected]}
                    onPress={() => setChoice('tails')}
                  >
                    <Text style={[styles.choiceButtonText, choice === 'tails' && styles.choiceButtonTextSelected]}>
                      Tails
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={loading || spinning ? styles.flipButtonDisabled : styles.buttonContainer}
                  onPress={handleFlip}
                  disabled={loading || spinning}
                >
                  <LinearGradient
                    colors={loading || spinning ? ['#475569', '#334155'] : ['#fbbf24', '#f59e0b']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.flipButtonText}>{loading || spinning ? 'FLIPPING...' : 'FLIP COIN'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {result && (
                  <View style={styles.resultBox}>
                    <Text style={styles.resultTitle}>Result: {result.toUpperCase()}</Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            {history.length > 0 && (
              <View style={styles.historyWrapper}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                  style={styles.historyCard}
                >
                  <Text style={styles.historyTitle}>Recent Plays</Text>
                  {history.map((game, index) => (
                    <View key={index} style={styles.historyItem}>
                      <View>
                        <Text style={styles.historyChoice}>Guessed: {game.choice.toUpperCase()}</Text>
                        <Text style={styles.historyTime}>{game.time}</Text>
                      </View>
                      <Text style={[styles.historyResultText, { color: game.win ? '#34d399' : '#f87171' }]}>
                        {game.win ? 'WON' : 'LOST'}
                      </Text>
                    </View>
                  ))}
                </LinearGradient>
              </View>
            )}
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
  webMessageBox: { backgroundColor: 'rgba(255,0,0,0.1)', padding: 10, borderRadius: 8, marginBottom: 15, width: '100%' },
  webMessageText: { color: '#fbbf24', textAlign: 'center', fontWeight: 'bold' },
  title: {
    fontSize: 28, fontWeight: '900', color: '#fbbf24', letterSpacing: 3,
    marginBottom: 30, textShadowColor: 'rgba(251,191,36,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10,
  },
  coinContainer: { marginBottom: 30 },
  coin: {
    width: 130, height: 130, borderRadius: 65, backgroundColor: '#fbbf24',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15,
  },
  coinImage: { width: '85%', height: '85%', borderRadius: 55 },
  balanceTag: {
    backgroundColor: 'rgba(251,191,36,0.1)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)',
  },
  balanceText: { color: '#fbbf24', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  inputContainer: { width: '100%', marginBottom: 20 },
  inputLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 16, padding: 20, fontSize: 18, color: '#f8fafc',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', textAlign: 'center', fontWeight: 'bold',
  },
  choiceContainer: { flexDirection: 'row', width: '100%', marginBottom: 24, gap: 12 },
  choiceButton: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 18, alignItems: 'center',
  },
  choiceButtonSelected: { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: '#fbbf24' },
  choiceButtonText: { color: '#94a3b8', fontSize: 16, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  choiceButtonTextSelected: { color: '#fbbf24' },
  buttonContainer: { width: '100%', borderRadius: 16, shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  flipButtonDisabled: { width: '100%', borderRadius: 16, opacity: 0.7 },
  buttonGradient: { paddingVertical: 20, borderRadius: 16, alignItems: 'center' },
  flipButtonText: { color: '#0f172a', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  resultBox: { marginTop: 24, padding: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, width: '100%', alignItems: 'center' },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', letterSpacing: 1 },
  historyWrapper: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
  historyCard: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#94a3b8', marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' },
  historyItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.4)', padding: 16, borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)',
  },
  historyTime: { fontSize: 11, color: '#64748b', marginTop: 4 },
  historyChoice: { fontSize: 13, color: '#cbd5e1', fontWeight: '600' },
  historyResultText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
});