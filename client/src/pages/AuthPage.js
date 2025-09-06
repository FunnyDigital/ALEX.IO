
import React, { useState } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './AuthPageMobile.css';

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
    <div className={`auth-root${isLogin ? '' : ' register'}`}> 
      <div className="auth-box">
        <Typography className={`auth-title${isLogin ? '' : ' register'}`}>
          {isLogin ? 'Login' : 'Register'}
        </Typography>
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <TextField fullWidth margin="normal" label="Username" name="username" value={form.username} onChange={handleChange} InputProps={{ style: { fontWeight: 700, fontFamily: 'Press Start 2P, monospace' } }} />
          )}
          <TextField fullWidth margin="normal" label="Email" name="email" value={form.email} onChange={handleChange} InputProps={{ style: { fontWeight: 700, fontFamily: 'Press Start 2P, monospace' } }} />
          <TextField fullWidth margin="normal" label="Password" name="password" type="password" value={form.password} onChange={handleChange} InputProps={{ style: { fontWeight: 700, fontFamily: 'Press Start 2P, monospace' } }} />
          {error && <Typography className="auth-error">{error}</Typography>}
          <Button fullWidth variant="contained" type="submit" className={isLogin ? '' : 'register'}>
            {isLogin ? 'Login' : 'Register'}
          </Button>
        </form>
        <Button fullWidth variant="text" className={isLogin ? '' : 'register'} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </Button>
      </div>
    </div>
  );
}

export default AuthPage;
