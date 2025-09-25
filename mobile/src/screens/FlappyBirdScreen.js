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
  Platform,
} from 'react-native';
import { apiService } from '../config/api';
import { auth } from '../config/firebase';

const { width, height } = Dimensions.get('window');
// Better mobile dimensions for proper centering
const gameWidth = Platform.OS === 'web' ? 800 : Math.min(width - 40, 380);
const gameHeight = Platform.OS === 'web' ? 600 : Math.min(height * 0.75, 650);
const BIRD_SIZE = 35; // Slightly bigger for better visibility
const PIPE_WIDTH = 50;
const PIPE_GAP = 160; // Even more gap for mobile
const GRAVITY = 0.3; // Increased from 0.4 to make it easier
const JUMP_FORCE = -4; // Increased from -8 for stronger jumps

export default function FlappyBirdScreen({ navigation }) {
  // Error handling
  const [error, setError] = useState(null);
  
  // Game States
  const [gameState, setGameState] = useState('menu'); // 'menu', 'countdown', 'playing', 'gameOver', 'celebrating', 'lost'
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetTime, setTargetTime] = useState(30);
  const [bet, setBet] = useState('');
  const [wallet, setWallet] = useState(null);
  const [multiplier, setMultiplier] = useState(1);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [gameResult, setGameResult] = useState(null); // Store game result for celebration/loss screen
  
  // Game Objects
  const [bird, setBird] = useState({ x: 50, y: gameHeight / 2, velocity: 0 });
  const [pipes, setPipes] = useState([]);
  const [background, setBackground] = useState({ x: 0 });
  
  // Refs for game loop
  const gameLoopRef = useRef();
  const timerRef = useRef();
  const birdRef = useRef(bird);
  const pipesRef = useRef(pipes);
  const backgroundRef = useRef(background);
  
  // Animation refs for celebration/loss effects
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const lastJumpRef = useRef(0); // Add jump throttling
  const pulseAnim = useRef(new Animated.Value(1)).current; // Animation for countdown

  // Time options (15s to 60s)
  const timeOptions = Array.from({ length: 10 }, (_, i) => 15 + i * 5);

  // Fetch wallet balance on mount
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setError(null);
        console.log('Fetching wallet data...');
        const response = await apiService.getWallet();
        console.log('Wallet response:', response);
        setWallet(response.data || response);
      } catch (error) {
        console.log('Error fetching wallet:', error);
        const errorMessage = error.code === 'ECONNABORTED' 
          ? 'Server connection timeout. Please try again.'
          : error.message?.includes('Network Error')
          ? 'Cannot connect to server. Please make sure the backend is running.'
          : 'Failed to load wallet data';
        setError(errorMessage);
        setWallet({ balance: 0 }); // Set default wallet
      }
    };

    // Only try to fetch wallet if we have an authenticated user
    if (auth.currentUser) {
      console.log('Authenticated user found, fetching wallet...');
      fetchWallet();
    } else {
      console.log('No authenticated user, setting demo mode');
      setWallet({ balance: 0 });
      setBet('0'); // Default to demo mode for unauthenticated users
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

  // Add keyboard support for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyPress = (event) => {
        if (event.code === 'Space' || event.key === ' ') {
          event.preventDefault(); // Prevent page scroll
          jump();
        }
      };

      // Add event listener
      document.addEventListener('keydown', handleKeyPress);

      // Cleanup event listener
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [gameState]); // Re-add listener when game state changes

  const startGame = () => {
    // Allow demo mode with bet = 0
    if (bet !== '0' && (!bet || isNaN(bet) || bet <= 0)) {
      const message = 'Please enter a valid bet amount or play in demo mode';
      if (Platform.OS === 'web') {
        console.log('Error:', message);
        setError(message);
      } else {
        Alert.alert('Error', message);
      }
      return;
    }

    // Check if user has sufficient balance (skip for demo mode)
    if (bet !== '0' && wallet && parseFloat(bet) > wallet.balance) {
      const message = `Your balance is $${wallet.balance.toFixed(2)} but you're trying to bet $${parseFloat(bet).toFixed(2)}. Please reduce your bet amount or add funds to your wallet.`;
      if (Platform.OS === 'web') {
        console.log('Insufficient Balance:', message);
        setError(message);
      } else {
        Alert.alert('Insufficient Balance', message, [{ text: 'OK' }]);
      }
      return;
    }

    // Reset game state and start countdown
    setGameState('countdown');
    setCountdown(3);
    setScore(0);
    setTimeLeft(targetTime);
    setMultiplier(1);
    setTotalWinnings(0);
    setBird({ x: 50, y: gameHeight / 2, velocity: 0 });
    setPipes([]);
    setBackground({ x: 0 });

    // Start countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        // Trigger pulse animation for each countdown number
        if (prev > 0) {
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.5,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
        
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Start actual game
          setGameState('playing');
          startGameTimer();
          startGameLoop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startGameTimer = () => {
    // Start game timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame(true); // Time completed successfully
          return 0;
        }
        
        // Increase multiplier every second (0.5x per second)
        const timeSurvived = targetTime - prev + 1;
        if (timeSurvived > 0) {
          const newMultiplier = 1 + (timeSurvived * 0.5);
          console.log(`Time survived: ${timeSurvived}s, New multiplier: ${newMultiplier}x`);
          setMultiplier(newMultiplier);
        }
        
        return prev - 1;
      });
    }, 1000);
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
      if (newY <= 30 || newY >= gameHeight - BIRD_SIZE - 100) {
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
      if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < gameWidth - 300) {
        const pipeHeight = Math.random() * (gameHeight - PIPE_GAP - 200) + 100;
        newPipes.push({
          x: gameWidth,
          topHeight: pipeHeight,
          bottomY: pipeHeight + PIPE_GAP,
          bottomHeight: gameHeight - pipeHeight - PIPE_GAP - 100,
          passed: false
        });
      }
      
      // Check for scoring and collisions
      newPipes.forEach(pipe => {
        // Check if bird passed pipe
        if (!pipe.passed && birdRef.current.x > pipe.x + PIPE_WIDTH) {
          pipe.passed = true;
          setScore(prev => prev + 1);
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
    console.log('=== GAME ENDING ===');
    console.log('Completed:', completed);
    console.log('Current bet:', bet);

    // Calculate the current multiplier based on time survived (always positive)
    const timeSurvived = Math.max(0, targetTime - timeLeft);
    const currentMultiplier = 1 + (timeSurvived * 0.5);
    console.log('Time survived:', timeSurvived);
    console.log('Calculated multiplier:', currentMultiplier);

    // Clear intervals
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    // Always update UI state and animation immediately
    setGameResult({
      completed,
      score,
      multiplier: currentMultiplier,
      winnings: completed ? parseFloat(bet) * currentMultiplier : 0,
      wallet: wallet || { balance: 0 },
      timeSurvived,
      targetTime,
      isDemo: bet === '0'
    });
    setGameState(completed ? 'celebrating' : 'lost');
    if (completed) {
      Animated.sequence([
        Animated.timing(celebrationAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }

    // If demo mode, skip API call
    if (bet === '0') return;

    // Run API call in background, update wallet and winnings if needed
    try {
      const totalWinnings = completed ? parseFloat(bet) * currentMultiplier : 0;
      const result = await apiService.flappyBird({
        bet: parseFloat(bet),
        completed,
        timeTarget: targetTime,
        timeSurvived,
        score,
        multiplier: currentMultiplier,
        totalWinnings
      });
      if (result.success) {
        const newWallet = result.wallet;
        setWallet(newWallet);
        // Update gameResult with real winnings and wallet if API returns them
        setGameResult(prev => ({
          ...prev,
          winnings: completed ? (result.winnings !== undefined ? result.winnings : totalWinnings) : 0,
          wallet: newWallet && typeof newWallet.balance === 'number' ? newWallet : prev.wallet
        }));
      }
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const resetGame = async () => {
    setGameState('menu');
    setCountdown(3);
    setScore(0);
    setTimeLeft(targetTime);
    setMultiplier(1);
    setTotalWinnings(0);
    setGameResult(null);
    
    // Reset animations
    celebrationAnim.setValue(0);
    confettiAnim.setValue(0);
    
    setBird({ x: 50, y: gameHeight / 2, velocity: 0 });
    setPipes([]);
    setBackground({ x: 0 });
    
    // Refresh wallet balance
    try {
      const user = auth.currentUser;
      if (user) {
        const response = await apiService.getWallet();
        setWallet(response.data || response);
        console.log('Wallet refreshed after game reset:', response.data || response);
      }
    } catch (error) {
      console.log('Error refreshing wallet:', error);
    }
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
      {/* Fish-like character with wings */}
      <View style={styles.fishBody}>
        <View style={styles.fishMain} />
        <View style={styles.fishFin} />
        <View style={styles.fishEye} />
        <View style={styles.fishWing} />
        <View style={styles.fishTail} />
      </View>
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
    <View style={[
      styles.background, 
      { 
        left: background.x % gameWidth,
        width: gameWidth * 2
      }
    ]}>
      {/* Sky gradient layers */}
      <View style={styles.skyLayer} />
      
      {/* Big fluffy clouds */}
      <View style={styles.cloudsContainer}>
        <Text style={styles.bigClouds}>☁️</Text>
        <Text style={[styles.bigClouds, { left: 120, top: 20 }]}>☁️</Text>
        <Text style={[styles.bigClouds, { left: 250, top: 10 }]}>☁️</Text>
        <Text style={[styles.bigClouds, { left: 380, top: 25 }]}>☁️</Text>
      </View>
      
      {/* Background buildings */}
      <View style={styles.buildingsContainer}>
        <View style={[styles.building, { height: 120, left: 50, backgroundColor: '#8E9AAF' }]} />
        <View style={[styles.building, { height: 90, left: 80, backgroundColor: '#CBC0D3' }]} />
        <View style={[styles.building, { height: 140, left: 150, backgroundColor: '#A8DADC' }]} />
        <View style={[styles.building, { height: 110, left: 200, backgroundColor: '#F1FAEE' }]} />
        <View style={[styles.building, { height: 95, left: 280, backgroundColor: '#E63946' }]} />
        <View style={[styles.building, { height: 130, left: 320, backgroundColor: '#457B9D' }]} />
      </View>
      
      {/* Animated swaying trees */}
      <Animated.View style={[
        styles.treesContainer,
        {
          transform: [{
            rotate: celebrationAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['-2deg', '2deg']
            })
          }]
        }
      ]}>
        <Text style={[styles.tree, { left: 100 }]}>🌳</Text>
        <Text style={[styles.tree, { left: 180 }]}>🌲</Text>
        <Text style={[styles.tree, { left: 300 }]}>🌳</Text>
        <Text style={[styles.tree, { left: 400 }]}>🌲</Text>
      </Animated.View>
    </View>
  );

  // Error Screen
  if (error) {
    return (
      <View style={styles.menuContainer}>
        <View style={styles.menuCard}>
          <Text style={styles.title}>🐦 Flappy Bird</Text>
          <Text style={[styles.subtitle, { color: 'red', marginBottom: 20 }]}>
            {error}
          </Text>
          
          <TouchableOpacity 
            style={styles.startButton} 
            onPress={() => {
              setError(null);
              // Try to reload wallet
              if (auth.currentUser) {
                apiService.getWallet()
                  .then((response) => setWallet(response.data || response))
                  .catch(() => setWallet({ balance: 0 }));
              }
            }}
          >
            <Text style={styles.startButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.startButton, { backgroundColor: '#4CAF50', marginTop: 10 }]} 
            onPress={() => {
              setError(null);
              setWallet({ balance: 0 });
              setBet('0'); // Set demo mode bet
            }}
          >
            <Text style={styles.startButtonText}>Play Demo Mode (No Betting)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.startButton, { backgroundColor: '#666', marginTop: 10 }]} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.startButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading Screen
  if (wallet === null) {
    return (
      <View style={styles.menuContainer}>
        <View style={styles.menuCard}>
          <Text style={styles.title}>🐦 Flappy Bird</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Menu Screen
  if (gameState === 'menu') {
    console.log('Rendering menu screen'); // Debug log
    return (
      <View style={styles.menuContainer}>
        <View style={styles.menuCard}>
          <Text style={styles.title}>🐦 Flappy Bird</Text>
          <Text style={styles.subtitle}>Survive the target time to win!</Text>
          
          {/* Demo Mode Indicator */}
          {bet === '0' && (
            <Text style={[styles.subtitle, { color: '#4CAF50', fontWeight: 'bold', marginBottom: 10 }]}>
              🎮 DEMO MODE - No Betting
            </Text>
          )}
          
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

  // Celebration Screen (Win)
  if (gameState === 'celebrating' && gameResult) {
    return (
      <View style={styles.celebrationContainer}>
        <Animated.View style={[
          styles.celebrationCard,
          {
            transform: [{
              scale: celebrationAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              })
            }],
            opacity: celebrationAnim
          }
        ]}>
          {/* Golden Trophy/Medal */}
          <Animated.View style={[
            styles.trophyContainer,
            {
              transform: [{
                scale: celebrationAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                })
              }, {
                rotateZ: celebrationAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '5deg'],
                })
              }],
              opacity: celebrationAnim
            }
          ]}>
            <View style={styles.trophyWrapper}>
              <View style={styles.trophy}>
                <Text style={styles.trophyIcon}>🏆</Text>
                <View style={styles.trophyStar}>
                  <Text style={styles.starIcon}>⭐</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <Text style={styles.celebrationTitle}>CONGRATULATIONS!</Text>
          <Text style={styles.celebrationSubtitle}>You're a Winner!</Text>
          
          {/* Enhanced Confetti Effect */}
          <Animated.View style={[
            styles.confettiContainer,
            {
              transform: [{
                translateY: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 10],
                })
              }],
              opacity: confettiAnim
            }
          ]}>
            <Text style={styles.confetti}>✨ 🎊 ✨ 🎉 ✨ 🎊 ✨</Text>
            <Text style={styles.confetti}>🌟 💫 🌟 💫 🌟 💫 🌟</Text>
            <Text style={styles.confetti}>🎊 ✨ 🎉 ✨ 🎊 ✨ 🎉</Text>
          </Animated.View>
          
          <View style={styles.resultStats}>
            <Text style={styles.statText}>Score: {gameResult.score}</Text>
            <Text style={styles.statText}>Time: {gameResult.timeSurvived}s / {gameResult.targetTime}s</Text>
            <Text style={styles.statText}>Multiplier: {gameResult.multiplier}x</Text>
            {gameResult.isDemo ? (
              <Text style={styles.demoText}>🎮 DEMO MODE - No Betting</Text>
            ) : (
              <>
                <Text style={styles.winningsText}>Winnings: ${gameResult.winnings.toFixed(2)}</Text>
                <Text style={styles.balanceText}>New Balance: ${(typeof gameResult.wallet === 'object' ? gameResult.wallet.balance : gameResult.wallet).toFixed(2)}</Text>
              </>
            )}
          </View>
          
          <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
            <Text style={styles.playAgainButtonText}>Play Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.menuButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Loss Screen
  if (gameState === 'lost' && gameResult) {
    return (
      <View style={styles.lossContainer}>
        <Animated.View style={[
          styles.lossCard,
          {
            transform: [{
              scale: celebrationAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })
            }],
            opacity: celebrationAnim
          }
        ]}>
          <Text style={styles.lossTitle}>💥 Game Over</Text>
          <Text style={styles.lossSubtitle}>Better luck next time!</Text>
          
          {/* Loss Effect */}
          <View style={styles.lossEffectContainer}>
            <Text style={styles.lossEffect}>💔 😔 💔</Text>
            <Text style={styles.lossEffect}>⚡ 💥 ⚡</Text>
          </View>
          
          <View style={styles.resultStats}>
            <Text style={styles.statText}>Score: {gameResult.score}</Text>
            <Text style={styles.statText}>Time: {gameResult.timeSurvived}s / {gameResult.targetTime}s</Text>
            <Text style={styles.statText}>Multiplier: {gameResult.multiplier}x</Text>
            {gameResult.isDemo ? (
              <Text style={styles.demoText}>🎮 DEMO MODE - No Betting</Text>
            ) : (
              <>
                <Text style={styles.lossText}>Bet Lost: ${parseFloat(bet).toFixed(2)}</Text>
                <Text style={styles.balanceText}>New Balance: ${(typeof gameResult.wallet === 'object' ? gameResult.wallet.balance : gameResult.wallet).toFixed(2)}</Text>
              </>
            )}
          </View>
          
          <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
            <Text style={styles.playAgainButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.menuButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Countdown Screen
  if (gameState === 'countdown') {
    return Platform.OS === 'web' ? (
      // Web version - boxed countdown
      <View style={styles.webGameWrapper}>
        <View style={styles.webGameContainer}>
          <View style={styles.gameContainer}>
            {/* Background */}
            {renderBackground()}
            
            {/* Ground indicator only */}
            <View style={styles.ground} />
            
            {/* Game Objects (static) */}
            {renderBird()}
            
            {/* Countdown Display */}
            <View style={styles.countdownContainer}>
              <Animated.Text style={[
                styles.countdownText,
                {
                  transform: [{ scale: pulseAnim }]
                }
              ]}>
                {countdown > 0 ? countdown : 'GO!'}
              </Animated.Text>
              <Text style={styles.countdownSubtext}>
                Get Ready!
              </Text>
            </View>
          </View>
        </View>
      </View>
    ) : (
      // Mobile version - full screen countdown
      <View style={styles.gameContainer}>
        {/* Background */}
        {renderBackground()}
        
        {/* Ground indicator only */}
        <View style={styles.ground} />
        
        {/* Game Objects (static) */}
        {renderBird()}
        
        {/* Countdown Display */}
        <View style={styles.countdownContainer}>
          <Animated.Text style={[
            styles.countdownText,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}>
            {countdown > 0 ? countdown : 'GO!'}
          </Animated.Text>
          <Text style={styles.countdownSubtext}>
            Get Ready!
          </Text>
        </View>
      </View>
    );
  }

  // Game Screen
  console.log('Game state:', gameState, 'Platform:', Platform.OS); // Debug log
  return Platform.OS === 'web' ? (
    // Web version - boxed game container
    <View style={styles.webGameWrapper}>
      <TouchableOpacity 
        style={styles.webGameContainer}
        activeOpacity={1} 
        onPress={jump}
      >
        <View style={styles.gameContainer}>
          {/* Background */}
          {renderBackground()}
          
          {/* Ground indicator only */}
          <View style={styles.ground} />
          
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
            <Text style={styles.instructionsText}>
              {Platform.OS === 'web' ? 'Tap or Press SPACEBAR to jump!' : 'Tap to jump!'}
            </Text>
          </View>

        </View>
      </TouchableOpacity>
    </View>
  ) : (
    // Mobile version - centered game area
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.gameContainer} 
        activeOpacity={1} 
        onPress={jump}
      >
      {/* Background */}
      {renderBackground()}
      
      {/* Ground indicator only */}
      <View style={styles.ground} />
      
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
        <Text style={styles.instructionsText}>
          {Platform.OS === 'web' ? 'Tap or Press SPACEBAR to jump!' : 'Tap to jump!'}
        </Text>
      </View>

    </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // Sky blue background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContainer: {
    flex: 1,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: gameWidth,
    height: gameHeight,
    backgroundColor: '#87CEEB',
    position: 'relative',
    alignSelf: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#8B4513',
    borderTopWidth: 3,
    borderTopColor: '#654321',
    zIndex: 10,
  },
  webGameWrapper: {
    flex: 1,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webGameContainer: {
    width: 800,
    height: 600,
    borderRadius: 15,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    border: '3px solid #34495e',
  },
  background: {
    position: 'absolute',
    top: 0,
    height: '100%',
    alignItems: 'center',
  },
  skyLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: 'linear-gradient(to bottom, #87CEEB, #E0F6FF)',
  },
  cloudsContainer: {
    position: 'absolute',
    top: 20,
    width: '100%',
    height: 100,
  },
  bigClouds: {
    position: 'absolute',
    fontSize: 40,
    opacity: 0.8,
    top: 0,
  },
  buildingsContainer: {
    position: 'absolute',
    bottom: 120,
    width: '100%',
    height: 150,
  },
  building: {
    position: 'absolute',
    width: 25,
    bottom: 0,
    borderRadius: 2,
    opacity: 0.6,
  },
  treesContainer: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    height: 50,
  },
  tree: {
    position: 'absolute',
    fontSize: 30,
    bottom: 0,
  },
  bird: {
    position: 'absolute',
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  fishBody: {
    position: 'relative',
    width: BIRD_SIZE,
    height: BIRD_SIZE,
  },
  fishMain: {
    position: 'absolute',
    width: BIRD_SIZE * 0.8,
    height: BIRD_SIZE * 0.6,
    backgroundColor: '#4A90E2',
    borderRadius: BIRD_SIZE * 0.3,
    top: BIRD_SIZE * 0.2,
    left: BIRD_SIZE * 0.1,
    borderWidth: 2,
    borderColor: '#2E5C8A',
  },
  fishFin: {
    position: 'absolute',
    width: BIRD_SIZE * 0.3,
    height: BIRD_SIZE * 0.4,
    backgroundColor: '#6A5ACD',
    borderRadius: BIRD_SIZE * 0.15,
    top: BIRD_SIZE * 0.1,
    left: BIRD_SIZE * 0.05,
    transform: [{ rotate: '30deg' }],
  },
  fishWing: {
    position: 'absolute',
    width: BIRD_SIZE * 0.4,
    height: BIRD_SIZE * 0.3,
    backgroundColor: '#8A2BE2',
    borderRadius: BIRD_SIZE * 0.15,
    top: BIRD_SIZE * 0.3,
    right: BIRD_SIZE * 0.05,
    transform: [{ rotate: '-20deg' }],
  },
  fishEye: {
    position: 'absolute',
    width: BIRD_SIZE * 0.15,
    height: BIRD_SIZE * 0.15,
    backgroundColor: 'white',
    borderRadius: BIRD_SIZE * 0.075,
    top: BIRD_SIZE * 0.25,
    left: BIRD_SIZE * 0.5,
    borderWidth: 1,
    borderColor: '#000',
  },
  fishTail: {
    position: 'absolute',
    width: BIRD_SIZE * 0.25,
    height: BIRD_SIZE * 0.4,
    backgroundColor: '#6A5ACD',
    borderRadius: BIRD_SIZE * 0.1,
    top: BIRD_SIZE * 0.3,
    left: -BIRD_SIZE * 0.1,
    transform: [{ rotate: '45deg' }],
  },
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: '#22c55e', // Brighter green for better visibility
    borderRadius: 5,
    borderWidth: 3, // Thicker border for better visibility
    borderColor: '#16a34a', // Darker green border for contrast
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // Android shadow
  },
  hud: {
    position: 'absolute',
    top: 35, // Moved down to avoid ceiling
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
  countdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 500,
  },
  countdownText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
    marginBottom: 10,
  },
  countdownSubtext: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
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
    backgroundColor: '#8E24AA',
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 25,
    marginBottom: 15,
    minWidth: 200,
    shadowColor: '#6A1B9A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#9C27B0',
  },
  playAgainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  menuButton: {
    backgroundColor: 'rgba(158, 158, 158, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 25,
    minWidth: 200,
    borderWidth: 2,
    borderColor: 'rgba(117, 117, 117, 0.4)',
  },
  menuButtonText: {
    color: '#757575',
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
  
  // Celebration Screen Styles
  celebrationContainer: {
    flex: 1,
    backgroundColor: '#6A1B9A', // Purple gradient base
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    padding: 35,
    alignItems: 'center',
    width: '100%',
    maxWidth: 370,
    shadowColor: '#4A148C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  trophyContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  trophyWrapper: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 50,
    padding: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  trophy: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyIcon: {
    fontSize: 60,
    color: '#FFD700',
    textShadowColor: '#FFA000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  trophyStar: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 3,
    borderWidth: 2,
    borderColor: '#FFA000',
  },
  starIcon: {
    fontSize: 16,
    color: '#FFA000',
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6A1B9A',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(106, 27, 154, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1,
  },
  celebrationSubtitle: {
    fontSize: 18,
    color: '#8E24AA',
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '600',
  },
  confettiContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  confetti: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 3,
    opacity: 0.9,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // Loss Screen Styles
  lossContainer: {
    flex: 1,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lossCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  lossTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 10,
  },
  lossSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  lossEffectContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lossEffect: {
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 2,
  },
  
  // Shared result styles
  resultStats: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 2,
  },
  winningsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 2,
  },
  lossText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f44336',
    marginVertical: 2,
  },
  demoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 2,
  },
});