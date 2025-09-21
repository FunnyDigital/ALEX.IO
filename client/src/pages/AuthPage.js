
import React, { useState } from 'react';
import { TextField, Button, Typography } from '@mui/material';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../App.css';


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
        const userRef = doc(db, 'users', userCredential.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            username: '',
            email: form.email,
            wallet: 0,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: form.username,
          email: form.email,
          wallet: 0,
          createdAt: new Date().toISOString()
        });
      }
      navigate('/games');
    } catch (err) {
      setError(err.message || 'Error');
    }
  };

  return (
    <div className="gaming-page">
      <div className="gaming-container">
        <div
          className="gaming-card"
          style={{
            padding: '32px',
            width: '100%',
            maxWidth: 400,
            minWidth: 320,
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}
            autoComplete="off"
          >
            {!isLogin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Typography
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 16,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Username
                </Typography>
                <TextField
                  fullWidth
                  name="username"
                  placeholder="Value"
                  value={form.username}
                  onChange={handleChange}
                  variant="outlined"
                  className="gaming-input"
                  InputProps={{
                    style: {
                      color: 'var(--text-primary)',
                      background: 'var(--accent-bg)',
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 400,
                      height: 48,
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: 48,
                      '& fieldset': {
                        borderColor: 'var(--border-secondary)',
                        borderWidth: 1,
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'var(--text-muted)',
                      opacity: 1,
                    },
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Typography
                style={{
                  color: 'var(--text-primary)',
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                Email
              </Typography>
              <TextField
                fullWidth
                name="email"
                placeholder="Value"
                value={form.email}
                onChange={handleChange}
                variant="outlined"
                className="gaming-input"
                InputProps={{
                  style: {
                    color: 'var(--text-primary)',
                    background: 'var(--accent-bg)',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 400,
                    height: 48,
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: 48,
                    '& fieldset': {
                      borderColor: 'var(--border-secondary)',
                      borderWidth: 1,
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--border-primary)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--border-primary)',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'var(--text-muted)',
                    opacity: 1,
                  },
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Typography
                style={{
                  color: 'var(--text-primary)',
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                Password
              </Typography>
              <TextField
                fullWidth
                name="password"
                type="password"
                placeholder="Value"
                value={form.password}
                onChange={handleChange}
                variant="outlined"
                className="gaming-input"
                InputProps={{
                  style: {
                    color: 'var(--text-primary)',
                    background: 'var(--accent-bg)',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 400,
                    height: 48,
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: 48,
                    '& fieldset': {
                      borderColor: 'var(--border-secondary)',
                      borderWidth: 1,
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--border-primary)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--border-primary)',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'var(--text-muted)',
                    opacity: 1,
                  },
                }}
              />
            </div>
            {error && (
              <Typography style={{ color: 'var(--red-accent)', fontWeight: 400, textAlign: 'center', fontSize: 14 }}>
                {error}
              </Typography>
            )}
            <Button
              fullWidth
              variant="contained"
              type="submit"
              className="gaming-button-primary"
              style={{
                marginTop: 16,
                background: 'var(--gradient-gold)',
                color: 'var(--primary-bg)',
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 8,
                textTransform: 'none',
                padding: '14px 0',
                border: 'none',
                boxShadow: 'var(--shadow-primary)',
              }}
            >
              {isLogin ? 'Sign In' : 'Register'}
            </Button>
            {isLogin && (
              <Typography
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 16,
                  textAlign: 'center',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  marginTop: 16,
                }}
              >
                Forgot password?
              </Typography>
            )}
          </form>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setIsLogin(!isLogin)}
            className="gaming-button-secondary"
            style={{
              marginTop: 24,
              background: 'var(--accent-bg)',
              color: 'var(--text-gold)',
              border: '2px solid var(--border-primary)',
              fontWeight: 500,
              fontSize: 16,
              borderRadius: 8,
              textTransform: 'none',
              padding: '14px 0',
              boxShadow: 'none',
            }}
          >
            {isLogin ? 'Get An Account' : 'Already have an account? Sign In'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
