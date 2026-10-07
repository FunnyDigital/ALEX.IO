const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let authPromise: Promise<import('firebase/auth').Auth> | null = null;

async function getAuthInstance() {
  if (!authPromise) {
    authPromise = (async () => {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getAuth } = await import('firebase/auth');
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      return getAuth(app);
    })();
  }
  return authPromise;
}

export async function firebaseSignIn(email: string, password: string) {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const auth = await getAuthInstance();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function firebaseSignUp(email: string, password: string) {
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  const auth = await getAuthInstance();
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function firebaseSignOut() {
  const { signOut } = await import('firebase/auth');
  const auth = await getAuthInstance();
  return signOut(auth);
}

export async function firebaseIdToken(): Promise<string | null> {
  const auth = await getAuthInstance();
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

export async function onFirebaseAuthChanged(
  callback: (user: { email: string | null; uid: string } | null) => void
) {
  const { onAuthStateChanged } = await import('firebase/auth');
  const auth = await getAuthInstance();
  return onAuthStateChanged(auth, (user) => {
    callback(user ? { email: user.email, uid: user.uid } : null);
  });
}
