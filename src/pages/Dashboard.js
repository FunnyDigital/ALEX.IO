import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        navigate('/');
      }
    };
    fetchProfile();
  }, [navigate]);

  if (!profile) return null;

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6">Welcome, {profile.username}</Typography>
      <Typography>Email: {profile.email}</Typography>
      <Typography>Wallet Balance: ${profile.wallet}</Typography>
      <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/games')}>
        Play Games
      </Button>
    </Paper>
  );
}

export default Dashboard;
