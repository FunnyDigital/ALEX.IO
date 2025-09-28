import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import AuthScreen from '../screens/AuthScreen';
import GamesScreen from '../screens/GamesScreen';
import CoinFlipScreen from '../screens/CoinFlipScreen';
import DiceRollScreen from '../screens/DiceRollScreen';
import TradeGambleScreen from '../screens/TradeGambleScreen';
import FlappyBirdScreen from '../screens/FlappyBirdScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main app screens
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Games') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#09090aff',
        },
        headerTintColor: '#000000ff',
        tabBarStyle: {
          backgroundColor: '#000000ff',
        },
      })}
    >
      <Tab.Screen name="Games" component={GamesScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
export default function AppNavigator({ user }) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? "Main" : "Auth"}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4747d3ff',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!user ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CoinFlip" 
              component={CoinFlipScreen}
              options={{ title: 'Coin Flip' }}
            />
            <Stack.Screen 
              name="DiceRoll" 
              component={DiceRollScreen}
              options={{ title: 'Dice Roll' }}
            />
            <Stack.Screen 
              name="TradeGamble" 
              component={TradeGambleScreen}
              options={{ title: 'Trade Gamble' }}
            />
            <Stack.Screen 
              name="FlappyBird" 
              component={FlappyBirdScreen}
              options={{ title: 'Flappy Bird' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}