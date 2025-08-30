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
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: '#f5f6fa' }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4, minWidth: 350, maxWidth: 400 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: '#1976d2', mb: 1 }}>
            {profile.username ? profile.username[0].toUpperCase() : '?'}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Welcome, {profile.username}</Typography>
          <Typography variant="body2" color="text.secondary">{profile.email}</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>Wallet Balance</Typography>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
          ₦{profile.wallet}
        </Typography>
        <Button fullWidth variant="contained" sx={{ mb: 2 }} onClick={() => navigate('/wallet')}>
          Wallet
        </Button>
        <Button fullWidth variant="contained" sx={{ mb: 2, bgcolor: '#43a047', ':hover': { bgcolor: '#388e3c' } }} onClick={() => navigate('/games')}>
          Play Games
        </Button>
        <Button fullWidth variant="outlined" sx={{ mb: 1 }} color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Paper>
    </Box>
  );
}

export default Dashboard;
