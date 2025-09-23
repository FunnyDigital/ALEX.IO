# Firebase Admin SDK Setup Guide

## Option 1: Using Environment Variables (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `alexio-b7a7c`
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key** and download the JSON file
5. Open the downloaded JSON file and copy the values to your `.env` file:

```bash
# Update your .env file with these values:
FIREBASE_PROJECT_ID=alexio-b7a7c
FIREBASE_PRIVATE_KEY_ID="paste_private_key_id_here"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nPASTE_YOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="paste_client_email_here"
FIREBASE_CLIENT_ID="paste_client_id_here"
```

## Option 2: Using Service Account File

1. Download the service account JSON file from Firebase Console
2. Rename it to: `alexio-b7a7c-firebase-adminsdk-fbsvc-313e56ff3d.json`
3. Place it in the `/server` directory
4. Uncomment this line in your `.env` file:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./alexio-b7a7c-firebase-adminsdk-fbsvc-313e56ff3d.json
   ```

## Quick Test

After setting up credentials, test with:
```bash
cd server
npm start
```

The server should start without Firebase credential errors.