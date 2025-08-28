# Alex.IO Gambling Website

## Features
- User authentication (JWT)
- User profiles and wallet management
- Deposit funds (Paystack integration coming soon)
- Games: Flappy Bird, Coin Flip, Dice Roll, Trade Gamble (up/down prediction)
- Mobile-friendly responsive UI (Material UI)

## Getting Started

### Backend
1. Install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Set up MongoDB and update `.env` with your connection string and JWT secret.
3. Start the backend:
   ```bash
   npm start
   ```

### Frontend
1. Install dependencies:
   ```bash
   cd client
   npm install
   ```
2. Start the frontend:
   ```bash
   npm start
   ```

### Notes
- Make sure MongoDB is running locally or update `.env` for remote connection.
- Payment integration (Paystack) will be added in the next phase.

## Folder Structure
- `client/` - React frontend
- `server/` - Node.js/Express backend
- `shared/` - Shared code (future use)

## License
MIT
