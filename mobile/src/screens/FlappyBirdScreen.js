import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  TextInput,
  ScrollView,
} from 'react-native';
import { apiService } from '../config/api';
import { auth } from '../config/firebase';

const { width, height } = Dimensions.get('window');
const BIRD_SIZE = 30;
const PIPE_WIDTH = 50;
const PIPE_GAP = 150;
const GRAVITY = 0.6;
const JUMP_FORCE = -8; // Reduced from -12 for better control

export default function FlappyBirdScreen({ navigation }) {
  // Game States
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'gameOver'
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetTime, setTargetTime] = useState(30);
  const [bet, setBet] = useState('');
  const [wallet, setWallet] = useState(null);
  const [multiplier, setMultiplier] = useState(1);
  const [totalWinnings, setTotalWinnings] = useState(0);
  
  // Game Objects
  const [bird, setBird] = useState({ x: 50, y: height / 2, velocity: 0 });
  const [pipes, setPipes] = useState([]);
  const [background, setBackground] = useState({ x: 0 });
  
  // Refs for game loop
  const gameLoopRef = useRef();
  const timerRef = useRef();
  const birdRef = useRef(bird);
  const pipesRef = useRef(pipes);
  const backgroundRef = useRef(background);
  const lastJumpRef = useRef(0); // Add jump throttling

  // Time options (15s to 60s)
  const timeOptions = Array.from({ length: 10 }, (_, i) => 15 + i * 5);

  // Fetch wallet balance on mount
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const walletData = await apiService.getWallet();
        setWallet(walletData);
      } catch (error) {
        console.log('Error fetching wallet:', error);
      }
    };

    if (auth.currentUser) {
      fetchWallet();
    }
  }, []);

  // Update refs when state changes
  useEffect(() => {
    birdRef.current = bird;
  }, [bird]);

  useEffect(() => {
    pipesRef.current = pipes;
  }, [pipes]);

  useEffect(() => {
    backgroundRef.current = background;
  }, [background]);

  const startGame = () => {
    if (!bet || isNaN(bet) || bet <= 0) {
      Alert.alert('Error', 'Please enter a valid bet amount');
      return;
    }

    // Check if user has sufficient balance
    if (wallet && parseFloat(bet) > wallet.balance) {
      Alert.alert(
        'Insufficient Balance', 
        `Your balance is $${wallet.balance.toFixed(2)} but you're trying to bet $${parseFloat(bet).toFixed(2)}. Please reduce your bet amount or add funds to your wallet.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Reset game state
    setGameState('playing');
    setScore(0);
    setTimeLeft(targetTime);
    setMultiplier(1);
    setTotalWinnings(0);
    setBird({ x: 50, y: height / 2, velocity: 0 });
    setPipes([]);
    setBackground({ x: 0 });

    // Start game timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame(true); // Time completed successfully
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start game loop
    startGameLoop();
  };

  const startGameLoop = () => {
    gameLoopRef.current = setInterval(() => {
      updateGame();
    }, 1000 / 60); // 60 FPS
  };

  const updateGame = () => {
    // Update bird physics
    setBird(prevBird => {
      const newVelocity = prevBird.velocity + GRAVITY;
      const newY = prevBird.y + newVelocity;
      
      // Check ground/ceiling collision
      if (newY <= 0 || newY >= height - BIRD_SIZE - 100) {
        endGame(false); // Collision
        return prevBird;
      }
      
      return { ...prevBird, y: newY, velocity: newVelocity };
    });

    // Update background
    setBackground(prev => ({
      x: prev.x - 2
    }));

    // Update pipes
    setPipes(prevPipes => {
      let newPipes = [...prevPipes];
      
      // Move existing pipes
      newPipes = newPipes.map(pipe => ({
        ...pipe,
        x: pipe.x - 3
      }));
      
      // Remove pipes that are off screen
      newPipes = newPipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);
      
      // Add new pipes
      if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < width - 200) {
        const pipeHeight = Math.random() * (height - PIPE_GAP - 200) + 100;
        newPipes.push({
          x: width,
          topHeight: pipeHeight,
          bottomY: pipeHeight + PIPE_GAP,
          bottomHeight: height - pipeHeight - PIPE_GAP - 100,
          passed: false
        });
      }
      
      // Check for scoring and collisions
      newPipes.forEach(pipe => {
        // Check if bird passed pipe
        if (!pipe.passed && birdRef.current.x > pipe.x + PIPE_WIDTH) {
          pipe.passed = true;
          setScore(prev => prev + 1);
          
          // Check for time milestones (every 5 seconds survived = bonus)
          const currentTime = targetTime - timeLeft;
          if (currentTime > 0 && currentTime % 5 === 0) {
            const bonus = parseFloat(bet) * 0.5;
            setMultiplier(prev => prev + 0.5);
            setTotalWinnings(prev => prev + bonus);
          }
        }
        
        // Check collision
        const birdRight = birdRef.current.x + BIRD_SIZE;
        const birdBottom = birdRef.current.y + BIRD_SIZE;
        const pipeRight = pipe.x + PIPE_WIDTH;
        
        if (birdRight > pipe.x && birdRef.current.x < pipeRight) {
          // Bird is in pipe's x range
          if (birdRef.current.y < pipe.topHeight || birdBottom > pipe.bottomY) {
            endGame(false); // Collision
            return;
          }
        }
      });
      
      return newPipes;
    });
  };

  const jump = () => {
    if (gameState !== 'playing') return;
    
    // Add jump throttling to prevent over-sensitive tapping
    const now = Date.now();
    if (now - lastJumpRef.current < 100) return; // Minimum 100ms between jumps
    lastJumpRef.current = now;
    
    setBird(prev => ({ ...prev, velocity: JUMP_FORCE }));
  };

  const endGame = async (completed) => {
    setGameState('gameOver');
    
    // Clear intervals
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // Send results to server
      const result = await apiService.flappyBird({
        bet: parseFloat(bet),
        completed,
        timeTarget: targetTime,
        timeSurvived: targetTime - timeLeft,
        score,
        multiplier,
        totalWinnings
      });
      
      if (result.success) {
        setWallet(result.wallet);
        
        const message = completed 
          ? `🎉 Congratulations! You survived ${targetTime} seconds!\n\nScore: ${score}\nMultiplier: ${multiplier}x\nWinnings: $${result.winnings?.toFixed(2) || 0}\nNew Balance: $${result.wallet.balance?.toFixed(2) || result.wallet}`
          : `💥 Game Over! You survived ${targetTime - timeLeft} seconds.\n\nScore: ${score}\nBet Lost: $${bet}\nNew Balance: $${result.wallet.balance?.toFixed(2) || result.wallet}`;
        
        Alert.alert(completed ? 'Victory!' : 'Game Over', message);
      }
    } catch (error) {
      console.error('Error ending game:', error);
      Alert.alert('Error', 'Failed to process game result. Please try again.');
    }
  };

  const resetGame = () => {
    setGameState('menu');
    setScore(0);
    setTimeLeft(targetTime);
    setMultiplier(1);
    setTotalWinnings(0);
    setBird({ x: 50, y: height / 2, velocity: 0 });
    setPipes([]);
    setBackground({ x: 0 });
  };

  // Game rendering components
  const renderBird = () => (
    <View
      style={[
        styles.bird,
        {
          left: bird.x,
          top: bird.y,
        }
      ]}
    >
      <Text style={styles.birdText}>�</Text> {/* Changed to forward-facing bird */}
    </View>
  );

  const renderPipes = () => (
    pipes.map((pipe, index) => (
      <View key={index}>
        {/* Top Pipe */}
        <View
          style={[
            styles.pipe,
            {
              left: pipe.x,
              top: 0,
              height: pipe.topHeight,
            }
          ]}
        />
        {/* Bottom Pipe */}
        <View
          style={[
            styles.pipe,
            {
              left: pipe.x,
              top: pipe.bottomY,
              height: pipe.bottomHeight,
            }
          ]}
        />
      </View>
    ))
  );

  const renderBackground = () => (
    <View style={[styles.background, { left: background.x % width }]}>
      <Text style={styles.backgroundText}>☁️ ☁️ ☁️ ☁️ ☁️</Text>
    </View>
  );

  // Menu Screen
  if (gameState === 'menu') {
    return (
      <View style={styles.container}>
        <View style={styles.menuCard}>
          <Text style={styles.title}>🐦 Flappy Bird</Text>
          <Text style={styles.subtitle}>Survive the target time to win!</Text>
          
          {/* Wallet Balance */}
          {wallet !== null && (
            <Text style={styles.balanceText}>
              Balance: ${typeof wallet === 'object' && wallet.balance !== undefined 
                ? wallet.balance.toFixed(2) 
                : wallet.toFixed(2)}
            </Text>
          )}

          {/* Bet Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bet Amount:</Text>
            <TextInput
              style={styles.input}
              value={bet}
              onChangeText={setBet}
              placeholder="Enter bet amount"
              keyboardType="numeric"
              placeholderTextColor="#666"
            />
          </View>

          {/* Time Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Target Time:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSelector}>
              {timeOptions.map(time => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeButton,
                    targetTime === time && styles.timeButtonSelected
                  ]}
                  onPress={() => setTargetTime(time)}
                >
                  <Text style={[
                    styles.timeButtonText,
                    targetTime === time && styles.timeButtonTextSelected
                  ]}>
                    {time}s
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Game Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🎯 Survive {targetTime} seconds to win!{'\n'}
              🏆 Every 5 seconds = +0.5x multiplier{'\n'}
              💰 Win = Bet × Final Multiplier{'\n'}
              💥 Lose = Lose bet amount only
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Game Screen
  return (
    <TouchableOpacity 
      style={styles.gameContainer} 
      activeOpacity={1} 
      onPress={jump}
    >
      {/* Background */}
      {renderBackground()}
      
      {/* Game Objects */}
      {renderBird()}
      {renderPipes()}
      
      {/* HUD */}
      <View style={styles.hud}>
        <Text style={styles.hudText}>Score: {score}</Text>
        <Text style={styles.hudText}>Time: {timeLeft}s</Text>
        <Text style={styles.hudText}>Multiplier: {multiplier}x</Text>
        {totalWinnings > 0 && (
          <Text style={styles.winningsText}>Winnings: ${totalWinnings.toFixed(2)}</Text>
        )}
      </View>
      
      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>Tap to jump!</Text>
      </View>

      {/* Game Over Modal */}
      {gameState === 'gameOver' && (
        <View style={styles.gameOverModal}>
          <View style={styles.gameOverCard}>
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.gameOverStats}>
              Score: {score}{'\n'}
              Time Survived: {targetTime - timeLeft}s / {targetTime}s{'\n'}
              Final Multiplier: {multiplier}x
            </Text>
            
            <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
              <Text style={styles.playAgainButtonText}>Play Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.menuButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1a1a2e',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
    textAlign: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#666',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 10,
    padding: 15,
    width: '100%',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#87CEEB',
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 50,
    width: width * 2,
    alignItems: 'center',
  },
  backgroundText: {
    fontSize: 20,
    opacity: 0.3,
  },
  bird: {
    position: 'absolute',
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  birdText: {
    fontSize: 25,
  },
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: '#228B22',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#006400',
  },
  hud: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 200,
  },
  hudText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  winningsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  instructionsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameOverModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 300,
  },
  gameOverCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    minWidth: 280,
  },
  gameOverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 15,
    textAlign: 'center',
  },
  gameOverStats: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  playAgainButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 10,
    minWidth: 150,
  },
  playAgainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  menuButton: {
    backgroundColor: '#666',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 150,
  },
  menuButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E8B57',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 2,
    borderColor: '#2E8B57',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    textAlign: 'center',
  },
  picker: {
    borderWidth: 2,
    borderColor: '#2E8B57',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  infoBox: {
    backgroundColor: '#F0F8FF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2E8B57',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 10,
    minWidth: 200,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeSelector: {
    maxHeight: 50,
  },
  timeButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#2E8B57',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  timeButtonSelected: {
    backgroundColor: '#2E8B57',
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
  },
  timeButtonTextSelected: {
    color: 'white',
  },
});