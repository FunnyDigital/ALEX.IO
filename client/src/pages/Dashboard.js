import React, { useEffect, useState } from 'react';
import { Typography, Paper, Button } from '@mui/material';
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
    <React.Fragment>
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6">Welcome, {profile.username}</Typography>
        <Typography>Email: {profile.email}</Typography>
        <Typography>Wallet Balance: ₦{profile.wallet}</Typography>
        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/wallet')}>
          Wallet
        </Button>
        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/games')}>
          Play Games
        </Button>
        <Button fullWidth variant="outlined" sx={{ mt: 2 }} color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Paper>
    </React.Fragment>
  );
}

export default Dashboard;
