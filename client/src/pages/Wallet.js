import React, { useState } from 'react';
import { Box, Typography, Paper, Button, TextField } from '@mui/material';
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
      const res = await fetch('/api/user/wallet/payout', {
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
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6">Wallet Actions</Typography>
      <Typography>Email: {profile.email}</Typography>
      <Typography>Wallet Balance: ₦{profile.wallet}</Typography>
      <Box sx={{ my: 2 }}>
        <PaystackDeposit
          token={localStorage.getItem('token')}
          onDeposit={wallet => setProfile({ ...profile, wallet })}
        />
      </Box>
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
        <Button onClick={handleWithdraw} disabled={withdrawAmount < 1} fullWidth variant="outlined">
          Withdraw (Local)
        </Button>
        {withdrawMsg && <div style={{ marginTop: 10 }}>{withdrawMsg}</div>}
      </Box>
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
        <Button onClick={handlePayout} disabled={withdrawAmount < 1 || !bankDetails.account_number || !bankDetails.bank_code} fullWidth variant="contained" color="success">
          Withdraw via Paystack
        </Button>
        {payoutMsg && <div style={{ marginTop: 10 }}>{payoutMsg}</div>}
      </Box>
      <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </Button>
    </Paper>
  );
}

export default Wallet;
