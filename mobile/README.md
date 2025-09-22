# ALEX.IO Mobile App

This is the React Native mobile version of the ALEX.IO gaming platform, converted from the original React web application.

## Features

- **Firebase Authentication**: Secure user login and registration
- **Game Integration**: 
  - Coin Flip game with animations
  - Dice Roll game with 6 numbers
  - Trade Gamble (Coming Soon)
  - Flappy Bird (Coming Soon)
- **Wallet Management**: Deposit and withdrawal functionality
- **Profile Management**: User profile with game statistics
- **Real-time Balance**: Synced with Firebase backend

## Project Structure

```
mobile/
├── src/
│   ├── config/
│   │   ├── firebase.js     # Firebase configuration for React Native
│   │   └── api.js          # API service with axios interceptors
│   ├── navigation/
│   │   └── AppNavigator.js # React Navigation setup
│   └── screens/
│       ├── AuthScreen.js
│       ├── GamesScreen.js
│       ├── WalletScreen.js
│       ├── ProfileScreen.js
│       ├── CoinFlipScreen.js
│       ├── DiceRollScreen.js
│       ├── TradeGambleScreen.js
│       └── FlappyBirdScreen.js
├── assets/
│   └── bitcoin.png         # Game assets
├── App.js                  # Main app component
└── package.json
```

## Installation

1. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```

2. Install Expo CLI globally (optional):
   ```bash
   npm install -g @expo/cli
   ```

## Running the App

### Web Preview
```bash
npx expo start --web
```

### Mobile Device
1. Install Expo Go app on your phone
2. Run: `npx expo start`
3. Scan the QR code with Expo Go

### Android Emulator
```bash
npx expo start --android
```

### iOS Simulator (macOS only)
```bash
npx expo start --ios
```

## Key Dependencies

- **React Native**: 0.81.4
- **Expo**: ~54.0.9
- **Firebase**: ^12.3.0
- **React Navigation**: ^7.1.17
- **Axios**: ^1.12.2
- **AsyncStorage**: 2.2.0

## Configuration

1. **Firebase**: The app uses the same Firebase configuration as the web app
2. **API**: Configure the API base URL in `src/config/api.js` (currently set to `http://localhost:5000`)
3. **Environment**: Update `.env` file with your server configurations

## Differences from Web App

1. **Styling**: Uses React Native StyleSheet instead of Tailwind CSS
2. **Navigation**: React Navigation instead of React Router
3. **Components**: Native mobile components instead of web components
4. **Animations**: React Native Animated API for smooth transitions
5. **Storage**: AsyncStorage for Firebase persistence

## Backend Integration

The mobile app connects to the same Express.js server and Firebase backend as the web version:
- Server endpoints: `/api/games/*`, `/api/user/*`
- Firebase Auth for authentication
- Firestore for user data and game results

## Games Implementation

### Coin Flip
- Interactive coin animation with rotation
- Real-time betting with server validation
- Game history tracking

### Dice Roll
- Animated dice rolling effect
- 6-number betting system
- 5x multiplier for correct guesses

### Trade Gamble & Flappy Bird
- Placeholder screens with "Coming Soon" functionality
- Will be implemented in future updates

## Future Enhancements

- [ ] Push notifications for game results
- [ ] Social features and leaderboards  
- [ ] Offline mode support
- [ ] Enhanced animations and effects
- [ ] Trade Gamble implementation
- [ ] Flappy Bird game development