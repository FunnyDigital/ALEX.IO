import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  ScrollView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { apiService } from '../config/api';
import { auth } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
// Better mobile dimensions for proper centering
const gameWidth = Platform.OS === 'web' ? 800 : width - 30;
const gameHeight = Platform.OS === 'web' ? 600 : height * 0.65;
const BIRD_SIZE = 35; // Slightly bigger for better visibility
const PIPE_WIDTH = 52;
const PIPE_GAP = 180; // Even more gap for mobile
const GRAVITY = 0.6; // Increased from 0.3 to make it easier
const JUMP_FORCE = -7; // Reduced jump force for smoother control

export default function FlappyBirdScreen({ navigation }) {
  // Error handling
  const [error, setError] = useState(null);
  
  // Game States
  const [gameState, setGameState] = useState('menu'); // 'menu', 'countdown', 'playing', 'gameOver', 'celebrating', 'lost'
  const [countdown, setCountdown] = useState(3);
  // Score removed in simplified version
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetTime, setTargetTime] = useState(30);
  const [bet, setBet] = useState('');
  const [wallet, setWallet] = useState(null);
  // Multiplier & total winnings removed (even money payout)
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
    setTimeLeft(targetTime);
  // Removed score/multiplier resets
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
        
        // Multiplier progression removed
        
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
      
      // Check for collisions (scoring removed)
      newPipes.forEach(pipe => {
        if (!pipe.passed && birdRef.current.x > pipe.x + PIPE_WIDTH) {
          pipe.passed = true; // maintain flag to avoid repeated processing
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

  // Simplified time survived (no multiplier)
  const timeSurvived = Math.max(0, targetTime - timeLeft);

    // Clear intervals
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    // Always update UI state and animation immediately
    setGameResult({
      completed,
      winnings: completed ? parseFloat(bet) * 0.96 : 0,
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
    if (bet === '0') {
      return;
    }

    // Run API call in background for settlement
    try {
      console.log('Starting flappyBird API call...');
      const result = await apiService.flappyBird({
        bet: parseFloat(bet),
        completed,
        timeTarget: targetTime,
        timeSurvived
      });
      console.log('FlappyBird API result:', result);
      
      if (result.data?.success) {
        console.log('Game settled successfully');
        if (result.data.wallet) {
          setWallet({ balance: result.data.wallet });
        }
      } else {
        console.error('API call failed:', result.data);
      }
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const resetGame = async () => {
    setGameState('menu');
    setCountdown(3);
    setTimeLeft(targetTime);
  // Removed score/multiplier reset
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
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.menuContainer}>
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']} style={styles.menuCard}>
          <Text style={styles.title}>🐦 FLAPPY BIRD</Text>
          <Text style={[styles.subtitle, { color: '#f43f5e', marginBottom: 20 }]}>
            {error}
          </Text>
          
          <TouchableOpacity 
            style={styles.startButtonWrapper} 
            onPress={() => {
              setError(null);
              if (auth.currentUser) {
                apiService.getWallet()
                  .then((response) => setWallet(response.data || response))
                  .catch(() => setWallet({ balance: 0 }));
              }
            }}
          >
            <LinearGradient colors={['#10b981', '#059669']} style={styles.startButton} start={{x:0, y:0}} end={{x:1, y:0}}>
              <Text style={styles.startButtonText}>TRY AGAIN</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.startButtonWrapper} 
            onPress={() => {
              setError(null);
              setWallet({ balance: 0 });
              setBet('0');
            }}
          >
            <LinearGradient colors={['rgba(56,189,248,0.2)', 'rgba(14,165,233,0.2)']} style={[styles.startButton, { borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)' }]} start={{x:0, y:0}} end={{x:1, y:0}}>
              <Text style={[styles.startButtonText, { color: '#38bdf8' }]}>PLAY DEMO MODE</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButtonWrapper} 
            onPress={() => navigation.goBack()}
          >
            <View style={styles.backButton}>
              <Text style={styles.backButtonText}>GO BACK</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
      </LinearGradient>
    );
  }



  // Menu Screen
  if (gameState === 'menu') {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.menuContainer}>
        <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']} style={styles.menuCard}>
          <Text style={styles.title}>🐦 FLAPPY BIRD</Text>
          <Text style={styles.subtitle}>Survive the target time to win!</Text>
          
          {bet === '0' && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>🎮 DEMO MODE</Text>
            </View>
          )}
          
          {wallet !== null && (
            <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                <Text style={styles.balanceText}>
                ₦{typeof wallet === 'object' && wallet.balance !== undefined 
                    ? wallet.balance.toLocaleString() 
                    : wallet.toLocaleString()}
                </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>BET AMOUNT (₦)</Text>
            <TextInput
              style={styles.input}
              value={bet}
              onChangeText={setBet}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>TARGET TIME</Text>
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

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🎯 Survive {targetTime}s to win!{'\n'}
              💰 Win = +96% Bet (Skill edge){'\n'}
              💥 Lose = -Bet amount
            </Text>
          </View>

          <TouchableOpacity style={styles.startButtonWrapper} onPress={startGame}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.startButton} start={{x:0, y:0}} end={{x:1, y:0}}>
              <Text style={styles.startButtonText}>START GAME</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButtonWrapper} 
            onPress={() => navigation.goBack()}
          >
             <View style={styles.backButton}>
              <Text style={styles.backButtonText}>BACK TO GAMES</Text>
             </View>
          </TouchableOpacity>
        </LinearGradient>
      </LinearGradient>
    );
  }

  // Celebration Screen (Win)
  if (gameState === 'celebrating' && gameResult) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.menuContainer}>
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
          {/* Trophy Icon */}
          <Animated.View style={[
            styles.trophyContainer,
            {
              transform: [{
                scale: celebrationAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                })
              }],
              opacity: celebrationAnim
            }
          ]}>
            <LinearGradient colors={['rgba(251,191,36,0.2)', 'rgba(217,119,6,0.2)']} style={styles.trophyWrapper}>
              <View style={styles.trophy}>
                <Text style={styles.trophyIcon}>🏆</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Text style={styles.celebrationTitle}>CONGRATULATIONS!</Text>
          <Text style={styles.celebrationSubtitle}>You're a Winner!</Text>
          
          <LinearGradient colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']} style={styles.resultStatsWrapper}>
            <Text style={styles.statLabel}>TIME SURVIVED</Text>
            <Text style={styles.statValue}>{gameResult.timeSurvived}s / {gameResult.targetTime}s</Text>
            
            <View style={styles.divider} />
            
            {gameResult.isDemo ? (
              <View style={styles.demoBadge}>
                <Text style={styles.demoBadgeText}>🎮 DEMO MODE</Text>
              </View>
            ) : (
              <>
                <Text style={styles.statLabel}>YOU WON</Text>
                <Text style={styles.winningsValue}>+₦{gameResult.winnings.toLocaleString()}</Text>
              </>
            )}
          </LinearGradient>
          
          <TouchableOpacity style={styles.startButtonWrapper} onPress={resetGame}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.startButton} start={{x:0, y:0}} end={{x:1, y:0}}>
              <Text style={styles.startButtonText}>PLAY AGAIN</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButtonWrapper} 
            onPress={() => navigation.goBack()}
          >
             <View style={styles.backButton}>
              <Text style={styles.backButtonText}>BACK TO MENU</Text>
             </View>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  // Loss Screen
  if (gameState === 'lost' && gameResult) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.menuContainer}>
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
          <Text style={styles.lossTitle}>💥 GAME OVER</Text>
          <Text style={styles.lossSubtitle}>Better luck next time!</Text>
          
          {/* Loss Effect */}
          <View style={styles.lossEffectContainer}>
            <Text style={styles.lossEffect}>💔 😔 💔</Text>
          </View>
          
          <LinearGradient colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']} style={styles.resultStatsWrapper}>
            <Text style={styles.statLabel}>TIME SURVIVED</Text>
            <Text style={styles.statValue}>{gameResult.timeSurvived}s / {gameResult.targetTime}s</Text>
            
            <View style={styles.divider} />
            
            {gameResult.isDemo ? (
               <View style={styles.demoBadge}>
                <Text style={styles.demoBadgeText}>🎮 DEMO MODE</Text>
              </View>
            ) : (
               <>
                <Text style={styles.statLabel}>YOU LOST</Text>
                <Text style={styles.lossValue}>-₦{parseFloat(bet).toLocaleString()}</Text>
              </>
            )}
          </LinearGradient>
          
          <TouchableOpacity style={styles.startButtonWrapper} onPress={resetGame}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.startButton} start={{x:0, y:0}} end={{x:1, y:0}}>
              <Text style={styles.startButtonText}>TRY AGAIN</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButtonWrapper} 
            onPress={() => navigation.goBack()}
          >
             <View style={styles.backButton}>
              <Text style={styles.backButtonText}>BACK TO MENU</Text>
             </View>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
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
            <Text style={styles.hudText}>Time: {timeLeft}s</Text>
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
        <Text style={styles.hudText}>Time: {timeLeft}s</Text>
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
  container: { flex: 1, backgroundColor: '#0f172a' },
  safeArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gameContainer: { width: gameWidth, height: gameHeight, backgroundColor: '#87CEEB', position: 'relative', alignSelf: 'center', borderRadius: 10, overflow: 'hidden' },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: '#8B4513', borderTopWidth: 3, borderTopColor: '#654321', zIndex: 10 },
  webGameWrapper: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  webGameContainer: { width: 800, height: 600, borderRadius: 15, overflow: 'hidden', border: '3px solid #334155' },
  
  menuContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  menuCard: { padding: 30, borderRadius: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10, width: '100%', maxWidth: 380 },
  title: { fontSize: 32, fontWeight: '900', color: '#10b981', marginBottom: 8, letterSpacing: 2, textShadowColor: 'rgba(16,185,129,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 },
  subtitle: { fontSize: 16, color: '#94a3b8', fontWeight: '600', letterSpacing: 1, marginBottom: 24, textAlign: 'center' },
  
  demoBadge: { backgroundColor: 'rgba(56,189,248,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)', marginBottom: 20 },
  demoBadgeText: { color: '#38bdf8', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  
  balanceContainer: { alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(15,23,42,0.6)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', width: '100%' },
  balanceLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  balanceText: { fontSize: 24, fontWeight: '900', color: '#f8fafc', letterSpacing: 1 },
  
  inputContainer: { width: '100%', marginBottom: 20 },
  inputLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  input: { backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: 16, padding: 16, fontSize: 16, color: '#f8fafc', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  timeSelector: { maxHeight: 55, marginTop: 4 },
  timeButton: { backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: 16, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 48 },
  timeButtonSelected: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: '#10b981' },
  timeButtonText: { fontSize: 16, fontWeight: '600', color: '#94a3b8' },
  timeButtonTextSelected: { color: '#10b981', fontWeight: 'bold' },
  
  infoBox: { backgroundColor: 'rgba(15,23,42,0.6)', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', width: '100%' },
  infoText: { fontSize: 13, color: '#94a3b8', lineHeight: 22 },
  
  startButtonWrapper: { width: '100%', marginBottom: 16, borderRadius: 16, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  startButton: { paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  
  backButtonWrapper: { width: '100%' },
  backButton: { paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  backButtonText: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

  celebrationCard: { padding: 30, borderRadius: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10, width: '100%', maxWidth: 380, backgroundColor: 'rgba(15,23,42,0.8)' },
  trophyContainer: { alignItems: 'center', marginBottom: 24 },
  trophyWrapper: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(251,191,36,0.4)', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  trophy: { justifyContent: 'center', alignItems: 'center' },
  trophyIcon: { fontSize: 48, shadowColor: '#f59e0b', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.5, shadowRadius: 5 },
  celebrationTitle: { fontSize: 24, fontWeight: '900', color: '#f8fafc', marginBottom: 4, letterSpacing: 1, textAlign: 'center' },
  celebrationSubtitle: { fontSize: 16, color: '#fbbf24', textAlign: 'center', marginBottom: 24, fontWeight: 'bold' },
  
  lossCard: { padding: 30, borderRadius: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)', shadowColor: '#e11d48', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10, width: '100%', maxWidth: 380, backgroundColor: 'rgba(15,23,42,0.8)' },
  lossTitle: { fontSize: 24, fontWeight: '900', color: '#f8fafc', marginBottom: 4, letterSpacing: 1, textAlign: 'center' },
  lossSubtitle: { fontSize: 16, color: '#f43f5e', textAlign: 'center', marginBottom: 24, fontWeight: 'bold' },
  lossEffectContainer: { alignItems: 'center', marginBottom: 24 },
  lossEffect: { fontSize: 32, marginVertical: 4 },

  resultStatsWrapper: { width: '100%', backgroundColor: 'rgba(15,23,42,0.6)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 24, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 18, color: '#f8fafc', fontWeight: '900' },
  divider: { height: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  winningsValue: { fontSize: 24, color: '#10b981', fontWeight: '900' },
  lossValue: { fontSize: 24, color: '#f43f5e', fontWeight: '900' },

  background: { position: 'absolute', top: 0, height: '100%', alignItems: 'center' },
  skyLayer: { position: 'absolute', top: 0, left: 0, right: 0, height: '70%', backgroundColor: 'linear-gradient(to bottom, #87CEEB, #E0F6FF)' },
  cloudsContainer: { position: 'absolute', top: 20, width: '100%', height: 100 },
  bigClouds: { position: 'absolute', fontSize: 40, opacity: 0.8, top: 0 },
  buildingsContainer: { position: 'absolute', bottom: 120, width: '100%', height: 150 },
  building: { position: 'absolute', width: 25, bottom: 0, borderRadius: 2, opacity: 0.6 },
  treesContainer: { position: 'absolute', bottom: 100, width: '100%', height: 50 },
  tree: { position: 'absolute', fontSize: 30, bottom: 0 },

  bird: { position: 'absolute', width: 35, height: 35, justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  fishBody: { position: 'relative', width: 35, height: 35 },
  fishMain: { position: 'absolute', width: 28, height: 21, backgroundColor: '#4A90E2', borderRadius: 10, top: 7, left: 3, borderWidth: 2, borderColor: '#2E5C8A' },
  fishFin: { position: 'absolute', width: 10, height: 14, backgroundColor: '#6A5ACD', borderRadius: 5, top: 3, left: 2, transform: [{ rotate: '30deg' }] },
  fishWing: { position: 'absolute', width: 14, height: 10, backgroundColor: '#8A2BE2', borderRadius: 5, top: 10, right: 2, transform: [{ rotate: '-20deg' }] },
  fishEye: { position: 'absolute', width: 5, height: 5, backgroundColor: 'white', borderRadius: 3, top: 9, left: 17, borderWidth: 1, borderColor: '#000' },
  fishTail: { position: 'absolute', width: 9, height: 14, backgroundColor: '#6A5ACD', borderRadius: 4, top: 10, left: -3, transform: [{ rotate: '45deg' }] },
  
  pipe: { position: 'absolute', width: 52, backgroundColor: '#22c55e', borderRadius: 5, borderWidth: 3, borderColor: '#16a34a', shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  
  hud: { position: 'absolute', top: 35, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 200 },
  hudText: { fontSize: 16, fontWeight: 'bold', color: 'white', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  
  instructionsContainer: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center', zIndex: 200 },
  instructionsText: { fontSize: 18, fontWeight: 'bold', color: 'white', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  
  countdownContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.3)', zIndex: 500 },
  countdownText: { fontSize: 80, fontWeight: 'bold', color: '#fbbf24', textShadowColor: '#000', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 5, marginBottom: 10 },
  countdownSubtext: { fontSize: 24, fontWeight: 'bold', color: 'white', textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3 },
});