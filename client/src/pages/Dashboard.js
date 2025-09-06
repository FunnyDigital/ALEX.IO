import React, { useEffect, useState } from 'react';
import { Typography, Button, Divider } from '@mui/material';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './DashboardMobile.css';

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
    <div className="dashboard-root">
      <div className="dashboard-box">
        <Typography className="dashboard-title">
          Welcome, {profile.username}
        </Typography>
        <Typography className="dashboard-email">{profile.email}</Typography>
        <Divider className="dashboard-divider" />
        <Typography className="dashboard-wallet-label">Wallet Balance</Typography>
        <Typography className="dashboard-wallet">₦{profile.wallet}</Typography>
        <Button fullWidth variant="contained" className="dashboard-btn wallet" onClick={() => navigate('/wallet')}>
          Wallet
        </Button>
        <Button fullWidth variant="contained" className="dashboard-btn games" onClick={() => navigate('/games')}>
          Play Games
        </Button>
        <Button fullWidth variant="outlined" className="dashboard-btn logout" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}

export default Dashboard;
