import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { TextField, Button, Typography, Paper, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ username: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let unsub = null;
    setLoading(true);
    const waitForAuth = () => {
      unsub = auth.onAuthStateChanged(async (user) => {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data());
            setForm({
              username: userDoc.data().username || '',
              phone: userDoc.data().phone || ''
            });
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    };
    waitForAuth();
    return () => { if (unsub) unsub(); };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setMsg('');
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          username: form.username,
          phone: form.phone
        });
        setProfile({ ...profile, username: form.username, phone: form.phone });
        setEdit(false);
        setMsg('Profile updated!');
      }
    } catch (err) {
      setMsg('Update failed.');
    }
  };

  if (loading) return (
    <div className="gaming-page">
      <div className="gaming-container">
        <div style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600 }}>Loading...</div>
      </div>
    </div>
  );
  
  if (!profile) return (
    <div className="gaming-page">
      <div className="gaming-container">
        <div style={{ color: 'var(--text-gold)', fontSize: 20, fontWeight: 700, textAlign: 'center' }}>
          No user data found. Please log in.
        </div>
      </div>
    </div>
  );

  return (
    <div className="gaming-page">
      <div className="gaming-container">
        <div className="gaming-card" style={{ 
          width: '100%', 
          maxWidth: 500, 
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Profile Header */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 16, 
            marginBottom: 32,
            width: '100%'
          }}>
            <div style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'var(--gradient-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid var(--border-primary)',
              boxShadow: 'var(--shadow-primary)'
            }}>
              <span style={{ 
                fontSize: 40, 
                fontWeight: 900, 
                color: 'var(--primary-bg)' 
              }}>
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ 
                fontSize: 28, 
                fontWeight: 700, 
                color: 'var(--text-gold)', 
                margin: '0 0 8px 0',
                letterSpacing: '1px'
              }}>
                {profile.username || 'User'}
              </h2>
              <div style={{ 
                color: 'var(--text-secondary)', 
                fontSize: 14,
                marginBottom: 16 
              }}>
                {profile.phone ? `+${profile.phone}` : 'No phone set'}
              </div>
            </div>
            
            {/* Wallet Display */}
            <div style={{
              background: 'var(--accent-bg)',
              border: '2px solid var(--border-primary)',
              borderRadius: 12,
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: 'var(--shadow-dark)'
            }}>
              <span style={{ 
                color: 'var(--text-gold)', 
                fontSize: 24, 
                fontWeight: 700 
              }}>
                ${profile.wallet}
              </span>
              <span style={{ 
                color: 'var(--text-secondary)', 
                fontSize: 12, 
                fontWeight: 600 
              }}>
                BALANCE
              </span>
            </div>
          </div>

          {/* Form Section */}
          <div style={{ width: '100%', marginBottom: 24 }}>
            <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <Typography style={{
                  color: 'var(--text-primary)',
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 6
                }}>
                  Username
                </Typography>
                <TextField
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  disabled={!edit}
                  fullWidth
                  placeholder="Enter username"
                  InputProps={{ 
                    style: { 
                      color: 'var(--text-primary)', 
                      background: 'var(--accent-bg)', 
                      borderRadius: 8, 
                      fontWeight: 500,
                      height: 48
                    } 
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: 48,
                      '& fieldset': {
                        borderColor: 'var(--border-secondary)',
                        borderWidth: 2,
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&.Mui-disabled fieldset': {
                        borderColor: 'var(--border-secondary)',
                        opacity: 0.6,
                      },
                    },
                    input: { color: 'var(--text-primary)', fontWeight: 500 },
                  }}
                />
              </div>
              
              <div>
                <Typography style={{
                  color: 'var(--text-primary)',
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 6
                }}>
                  Phone Number
                </Typography>
                <TextField
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={!edit}
                  fullWidth
                  placeholder="Enter phone number"
                  InputProps={{ 
                    style: { 
                      color: 'var(--text-primary)', 
                      background: 'var(--accent-bg)', 
                      borderRadius: 8, 
                      fontWeight: 500,
                      height: 48
                    } 
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: 48,
                      '& fieldset': {
                        borderColor: 'var(--border-secondary)',
                        borderWidth: 2,
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--border-primary)',
                      },
                      '&.Mui-disabled fieldset': {
                        borderColor: 'var(--border-secondary)',
                        opacity: 0.6,
                      },
                    },
                    input: { color: 'var(--text-primary)', fontWeight: 500 },
                  }}
                />
              </div>
            </form>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: 16, 
            width: '100%',
            flexDirection: window.innerWidth < 480 ? 'column' : 'row'
          }}>
            {!edit ? (
              <Button 
                variant="contained" 
                onClick={() => setEdit(true)} 
                fullWidth
                className="gaming-button-primary"
                style={{
                  background: 'var(--gradient-gold)',
                  color: 'var(--primary-bg)',
                  fontWeight: 700,
                  fontSize: 16,
                  borderRadius: 8,
                  padding: '12px 0',
                  boxShadow: 'var(--shadow-primary)'
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button 
                  variant="contained" 
                  onClick={handleSave} 
                  fullWidth
                  className="gaming-button-primary"
                  style={{
                    background: 'var(--gradient-blue)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 16,
                    borderRadius: 8,
                    padding: '12px 0',
                    boxShadow: 'var(--shadow-primary)'
                  }}
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => { 
                    setEdit(false); 
                    setForm({ 
                      username: profile.username || '', 
                      phone: profile.phone || '' 
                    }); 
                  }} 
                  fullWidth
                  className="gaming-button-secondary"
                  style={{
                    background: 'transparent',
                    color: 'var(--text-gold)',
                    border: '2px solid var(--border-primary)',
                    fontWeight: 600,
                    fontSize: 16,
                    borderRadius: 8,
                    padding: '12px 0'
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
          
          {msg && (
            <Typography style={{ 
              marginTop: 16, 
              color: msg.includes('updated') ? 'var(--green-accent)' : 'var(--red-accent)',
              fontWeight: 500,
              textAlign: 'center'
            }}>
              {msg}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
}
