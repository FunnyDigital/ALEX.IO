
import React, { useState } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
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
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isLogin ? 'linear-gradient(135deg, #e94f4f 0%, #ff7c7c 100%)' : 'linear-gradient(135deg, #4f6ee9 0%, #7cbcff 100%)',
      transition: 'background 0.5s',
    }}>
      <Box sx={{
        background: '#fff',
        borderRadius: '32px',
        boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)',
        padding: '2.5rem 2rem',
        maxWidth: 400,
        width: '100%',
        textAlign: 'center',
        position: 'relative',
      }}>
        <Typography variant="h3" fontWeight={900} sx={{
          color: isLogin ? '#e94f4f' : '#4f6ee9',
          letterSpacing: '2px',
          mb: 2,
          textTransform: 'uppercase',
        }}>
          {isLogin ? 'Login' : 'Register'}
        </Typography>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <TextField fullWidth margin="normal" label="Username" name="username" value={form.username} onChange={handleChange} InputProps={{ style: { fontWeight: 700 } }} />
          )}
          <TextField fullWidth margin="normal" label="Email" name="email" value={form.email} onChange={handleChange} InputProps={{ style: { fontWeight: 700 } }} />
          <TextField fullWidth margin="normal" label="Password" name="password" type="password" value={form.password} onChange={handleChange} InputProps={{ style: { fontWeight: 700 } }} />
          {error && <Typography color="error" sx={{ mt: 1, fontWeight: 700 }}>{error}</Typography>}
          <Button fullWidth variant="contained" type="submit" sx={{
            mt: 3,
            py: 1.5,
            fontWeight: 900,
            fontSize: '1.1rem',
            borderRadius: '16px',
            bgcolor: isLogin ? '#e94f4f' : '#4f6ee9',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            ':hover': { bgcolor: isLogin ? '#ff7c7c' : '#7cbcff' },
          }}>
            {isLogin ? 'Login' : 'Register'}
          </Button>
        </form>
        <Button fullWidth sx={{ mt: 2, fontWeight: 700, color: isLogin ? '#e94f4f' : '#4f6ee9', borderRadius: '16px', bgcolor: '#f5f5f5', ':hover': { bgcolor: '#eee' } }} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </Button>
      </Box>
    </Box>
  );
}

export default AuthPage;
