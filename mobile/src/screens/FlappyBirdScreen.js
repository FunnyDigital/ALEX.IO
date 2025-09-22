import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

export default function FlappyBirdScreen({ navigation }) {
  const handleComingSoon = () => {
    Alert.alert(
      'Coming Soon!',
      'Flappy Bird game is under development and will be available in the next update with React Native game libraries.',
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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Flappy Bird</Text>
        <Text style={styles.emoji}>🐦</Text>
        <Text style={styles.subtitle}>
          Navigate through obstacles and win rewards!
        </Text>
        
        <Text style={styles.description}>
          This mobile-optimized Flappy Bird game will challenge your reflexes 
          while giving you chances to win cryptocurrency rewards based on your 
          high scores.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleComingSoon}>
          <Text style={styles.buttonText}>Coming Soon</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back to Games</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});