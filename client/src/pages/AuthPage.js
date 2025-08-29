import React, { useState } from 'react';
import { TextField, Button, Typography, Paper } from '@mui/material';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
        // Ensure Firestore user document exists
        const userRef = doc(db, 'users', userCredential.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            username: '', // You can prompt for username later
            email: form.email,
            wallet: 0,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        // Save user profile to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: form.username,
          email: form.email,
          wallet: 0,
          createdAt: new Date().toISOString()
        });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error');
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        {isLogin ? 'Login' : 'Register'}
      </Typography>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <TextField fullWidth margin="normal" label="Username" name="username" value={form.username} onChange={handleChange} />
        )}
        <TextField fullWidth margin="normal" label="Email" name="email" value={form.email} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="Password" name="password" type="password" value={form.password} onChange={handleChange} />
        {error && <Typography color="error">{error}</Typography>}
        <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>
          {isLogin ? 'Login' : 'Register'}
        </Button>
      </form>
      <Button fullWidth sx={{ mt: 2 }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </Button>
    </Paper>
  );
}

export default AuthPage;
