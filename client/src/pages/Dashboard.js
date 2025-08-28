import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PaystackDeposit from '../components/PaystackDeposit';

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [withdrawMsg, setWithdrawMsg] = useState('');
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

  const handleWithdraw = async () => {
    setWithdrawMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/user/wallet/withdraw', {
        amount: withdrawAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile({ ...profile, wallet: res.data.wallet });
      setWithdrawMsg('Withdrawal successful!');
    } catch (err) {
      setWithdrawMsg(err.response?.data?.message || 'Withdrawal failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6">Welcome, {profile.username}</Typography>
      <Typography>Email: {profile.email}</Typography>
      <Typography>Wallet Balance: ₦{profile.wallet}</Typography>
      <Box sx={{ my: 2 }}>
        <PaystackDeposit
          token={localStorage.getItem('token')}
          onDeposit={wallet => setProfile({ ...profile, wallet })}
        />
      </Box>
      <Box sx={{ my: 2 }}>
        <Typography variant="subtitle1">Withdraw from Wallet</Typography>
        <input
          type="number"
          min="1"
          value={withdrawAmount}
          onChange={e => setWithdrawAmount(Number(e.target.value))}
          placeholder="Amount (NGN)"
          style={{ width: '100%', marginBottom: 10 }}
        />
        <Button onClick={handleWithdraw} disabled={withdrawAmount < 1} fullWidth variant="outlined">
          Withdraw
        </Button>
        {withdrawMsg && <div style={{ marginTop: 10 }}>{withdrawMsg}</div>}
      </Box>
      <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/games')}>
        Play Games
      </Button>
      <Button fullWidth variant="outlined" sx={{ mt: 2 }} color="error" onClick={handleLogout}>
        Logout
      </Button>
    </Paper>
  );
}

export default Dashboard;
