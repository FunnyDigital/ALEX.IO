import React, { useEffect, useState } from 'react';
import { Typography, Paper, Button, Avatar, Box, Divider } from '@mui/material';
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
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e94f4f 0%, #ff7c7c 100%)',
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
          color: '#e94f4f',
          letterSpacing: '2px',
          mb: 2,
          textTransform: 'uppercase',
        }}>
          Welcome, {profile.username}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>{profile.email}</Typography>
        <Divider sx={{ mb: 2, bgcolor: '#e94f4f', height: 2, borderRadius: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e94f4f', mb: 1 }}>Wallet Balance</Typography>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#e94f4f', mb: 2 }}>
          ₦{profile.wallet}
        </Typography>
        <Button fullWidth variant="contained" sx={{ mb: 2, py: 1.5, fontWeight: 900, fontSize: '1.1rem', borderRadius: '16px', bgcolor: '#e94f4f', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', ':hover': { bgcolor: '#ff7c7c' } }} onClick={() => navigate('/wallet')}>
          Wallet
        </Button>
        <Button fullWidth variant="contained" sx={{ mb: 2, py: 1.5, fontWeight: 900, fontSize: '1.1rem', borderRadius: '16px', bgcolor: '#4f6ee9', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', ':hover': { bgcolor: '#7cbcff' } }} onClick={() => navigate('/games')}>
          Play Games
        </Button>
        <Button fullWidth variant="outlined" sx={{ mb: 1, py: 1.5, fontWeight: 900, fontSize: '1.1rem', borderRadius: '16px', color: '#e94f4f', borderColor: '#e94f4f', ':hover': { bgcolor: '#ffeaea' } }} onClick={handleLogout}>
          Logout
        </Button>
      </Box>
    </Box>
  );
}

export default Dashboard;
