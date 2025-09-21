import React, { useEffect, useState } from 'react';
import { Typography, Button, Divider } from '@mui/material';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';


function Dashboard() {
  const [profile, setProfile] = useState(null);
  // Removed duplicate declaration. Only use string version below.
  // ...existing code...
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // ...existing code...

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return <React.Fragment><Typography>Loading...</Typography></React.Fragment>;
  }
  if (!profile) {
    return <React.Fragment><Typography>User profile not found.</Typography></React.Fragment>;
  }
  return (
    <div className="gaming-page">
      <div className="gaming-container">
        <div className="gaming-card" style={{
          width: '100%',
          maxWidth: 400,
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24
        }}>
          <div style={{
            color: 'var(--text-gold)',
            textAlign: 'center',
            fontSize: 32,
            fontWeight: 700,
            margin: 0
          }}>
            Welcome Back!
          </div>
          
          <div style={{
            color: 'var(--text-primary)',
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 600
          }}>
            {profile.username}
          </div>
          
          <div style={{
            color: 'var(--text-secondary)',
            textAlign: 'center',
            fontSize: 14
          }}>
            {profile.email}
          </div>
          
          <Divider sx={{ 
            width: '100%', 
            bgcolor: 'var(--border-primary)', 
            height: 2, 
            borderRadius: 1,
            my: 1
          }} />
          
          <div style={{
            color: 'var(--text-secondary)',
            textAlign: 'center',
            fontSize: 16,
            fontWeight: 600,
            marginBottom: -8
          }}>
            Wallet Balance
          </div>
          
          <div style={{
            color: 'var(--text-gold)',
            textAlign: 'center',
            fontSize: 28,
            fontWeight: 700,
            textShadow: 'var(--text-shadow)'
          }}>
            ${profile.wallet}
          </div>
          
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => navigate('/wallet')}
            className="gaming-button-primary"
            sx={{ 
              background: 'var(--gradient-gold)',
              color: 'var(--primary-bg)',
              fontWeight: 700,
              fontSize: 16,
              borderRadius: 2,
              padding: '12px 0',
              boxShadow: 'var(--shadow-primary)',
              mb: 1
            }}
          >
            Manage Wallet
          </Button>
          
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => navigate('/games')}
            className="gaming-button-secondary"
            sx={{ 
              background: 'var(--gradient-secondary)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 16,
              borderRadius: 2,
              padding: '12px 0',
              boxShadow: 'var(--shadow-secondary)',
              mb: 1,
              border: '1px solid var(--border-primary)'
            }}
          >
            Play Games
          </Button>
          
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={handleLogout}
            sx={{ 
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-secondary)',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              padding: '12px 0',
              '&:hover': {
                borderColor: 'var(--red-accent)',
                color: 'var(--red-accent)',
                background: 'var(--accent-bg)'
              }
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
