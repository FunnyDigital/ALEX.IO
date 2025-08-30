import React, { useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Divider } from '@mui/material';
import PaystackDeposit from '../components/PaystackDeposit';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function Wallet() {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [bankDetails, setBankDetails] = useState({ account_number: '', bank_code: '' });
  const [payoutMsg, setPayoutMsg] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleWithdraw = async () => {
    setWithdrawMsg('');
    try {
      const user = auth.currentUser;
      const userRef = doc(db, 'users', user.uid);
      if (profile.wallet < Number(withdrawAmount)) {
        setWithdrawMsg('Insufficient balance');
        return;
      }
      await updateDoc(userRef, {
        wallet: profile.wallet - Number(withdrawAmount)
      });
      setProfile({ ...profile, wallet: profile.wallet - Number(withdrawAmount) });
      setWithdrawMsg('Withdrawal successful!');
    } catch (err) {
      setWithdrawMsg('Withdrawal failed.');
    }
  };

  const handleBankChange = (e) => {
    setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
  };

  const handlePayout = async () => {
    setPayoutMsg('');
    try {
  const res = await fetch('https://api-v2ckmk5jla-uc.a.run.app/api/user/wallet/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          account_number: bankDetails.account_number,
          bank_code: bankDetails.bank_code
        })
      });
      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, wallet: data.wallet });
        setPayoutMsg('Payout successful!');
      } else {
        setPayoutMsg(data.message || 'Payout failed.');
      }
    } catch (err) {
      setPayoutMsg('Payout failed.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No user data found.</div>;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: '#f5f6fa' }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4, minWidth: 350, maxWidth: 400 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Wallet Actions</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{profile.email}</Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>Wallet Balance</Typography>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
          ₦{profile.wallet}
        </Typography>
        <Box sx={{ my: 2 }}>
          <PaystackDeposit
            token={localStorage.getItem('token')}
            onDeposit={wallet => setProfile({ ...profile, wallet })}
          />
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1">Withdraw from Wallet (Direct)</Typography>
          <TextField
            type="number"
            label="Amount (NGN)"
            min="1"
            value={withdrawAmount}
            onChange={e => setWithdrawAmount(e.target.value)}
            fullWidth
            sx={{ mb: 1 }}
          />
          <Button onClick={handleWithdraw} disabled={withdrawAmount < 1} fullWidth variant="outlined" sx={{ mb: 1 }}>
            Withdraw (Local)
          </Button>
          {withdrawMsg && <Typography color={withdrawMsg.includes('successful') ? 'primary' : 'error'} sx={{ mt: 1 }}>{withdrawMsg}</Typography>}
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1">Withdraw via Paystack Payout</Typography>
          <TextField
            label="Account Number"
            name="account_number"
            value={bankDetails.account_number}
            onChange={handleBankChange}
            fullWidth
            sx={{ mb: 1 }}
          />
          <TextField
            label="Bank Code"
            name="bank_code"
            value={bankDetails.bank_code}
            onChange={handleBankChange}
            fullWidth
            sx={{ mb: 1 }}
          />
          <TextField
            type="number"
            label="Amount (NGN)"
            min="1"
            value={withdrawAmount}
            onChange={e => setWithdrawAmount(e.target.value)}
            fullWidth
            sx={{ mb: 1 }}
          />
          <Button onClick={handlePayout} disabled={withdrawAmount < 1 || !bankDetails.account_number || !bankDetails.bank_code} fullWidth variant="contained" color="success" sx={{ mb: 1 }}>
            Withdraw via Paystack
          </Button>
          {payoutMsg && <Typography color={payoutMsg.includes('successful') ? 'primary' : 'error'} sx={{ mt: 1 }}>{payoutMsg}</Typography>}
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}

export default Wallet;
