# Alex.IO Gaming Platform

A full-stack gaming platform with both web and mobile applications, featuring cryptocurrency-style games with Firebase backend.

## Project Structure

This project contains multiple applications:

- **`client/`** - React.js web application (original)
- **`mobile/`** - React Native mobile app (Expo)
- **`server/`** - Node.js/Express backend API
- **`functions/`** - Firebase Cloud Functions

## Features

### Core Features
- 🔐 **Firebase Authentication** - Secure user registration/login
- 💰 **Digital Wallet** - Deposit/withdraw with Paystack integration
- 🎮 **Gaming Suite**:
  - Coin Flip - Classic heads/tails betting
  - Dice Roll - Number prediction with 5x multiplier
  - Trade Gamble - Cryptocurrency price prediction (coming soon)
  - Flappy Bird - Skill-based rewards (coming soon)
- 📱 **Cross-Platform** - Web and mobile support
- 👤 **User Profiles** - Game statistics and account management

### Technical Stack

**Frontend (Web)**:
- React 18 with Material-UI
- React Router for navigation
- Tailwind CSS for styling
- Firebase SDK for authentication

**Mobile App**:
- React Native with Expo
- React Navigation
- React Native StyleSheet
- Native animations and components

**Backend**:
- Node.js with Express
- Firebase Admin SDK
- Firestore database
- RESTful API design

## Getting Started

### Prerequisites
- Node.js 16+ 
- Firebase project with Firestore enabled
- Expo CLI (for mobile development)

### 1. Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication and Firestore
3. Update Firebase configuration in both `client/src/firebase.js` and `mobile/src/config/firebase.js`

### 2. Backend Setup
```bash
cd server
npm install
# Update .env with your Firebase admin credentials
npm start
```

### 3. Web App Setup
```bash
cd client
npm install
npm start
```

### 4. Mobile App Setup
```bash
cd mobile
npm install
# For web preview
npx expo start --web
# For mobile device (install Expo Go app)
npx expo start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Games
- `POST /api/games/coinflip` - Play coin flip game
- `POST /api/games/dice-roll` - Play dice roll game

### User Management  
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/deposit` - Deposit funds
- `POST /api/user/withdraw` - Withdraw funds

## Mobile App Conversion

The React Native mobile app was converted from the original React web app with the following changes:

### Navigation
- **Web**: React Router → **Mobile**: React Navigation
- Stack navigator for game screens
- Tab navigator for main sections

### Styling
- **Web**: Tailwind CSS → **Mobile**: React Native StyleSheet
- Responsive design adapted for mobile screens
- Native animations using Animated API

### Components
- **Web**: HTML/CSS → **Mobile**: React Native components
- Touch-friendly interfaces
- Platform-specific optimizations

### State Management
- Same Firebase integration
- AsyncStorage for offline persistence
- Centralized API service with axios

## Deployment

### Web App
- Build: `cd client && npm run build`
- Deploy to Netlify, Vercel, or Firebase Hosting

### Mobile App
- **Development**: Expo Go app
- **Production**: `expo build` for app stores
- **Web**: `expo build:web` for web deployment

### Backend
- Deploy to Railway, Heroku, or Firebase Functions
- Update CORS settings for production domains

## Environment Variables

### Server (.env)
```
FIREBASE_ADMIN_KEY=your_firebase_admin_key
PORT=5000
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

### Mobile (.env)
```
API_BASE_URL=http://localhost:5000
```

## Game Rules

### Coin Flip
- Choose heads or tails
- Win: 1:1 payout ratio
- Lose: Forfeit bet amount

### Dice Roll  
- Guess number 1-6
- Win: 5:1 payout ratio
- Lose: Forfeit bet amount

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create GitHub issue
- Check documentation in individual app folders
- Review API documentation

---

**Made with ❤️ for the gaming community**
