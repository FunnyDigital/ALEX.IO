import React, { useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Divider } from '@mui/material';
import PaystackDeposit from '../components/PaystackDeposit';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
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
      if (!user) {
        setWithdrawMsg('Not authenticated');
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch('/api/user/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(withdrawAmount) })
      });
      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, wallet: data.wallet });
        setWithdrawMsg('Withdrawal successful!');
      } else {
        setWithdrawMsg(data.message || 'Withdrawal failed.');
      }
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
    <div className="gaming-page">
      <div className="gaming-container">
        <div className="gaming-card" style={{
          width: '100%',
          maxWidth: 450,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          <div style={{
            color: 'var(--text-gold)',
            textAlign: 'center',
            fontSize: 28,
            fontWeight: 700,
            margin: 0
          }}>
            Wallet Manager
          </div>
          
          <div style={{
            color: 'var(--text-secondary)',
            textAlign: 'center',
            fontSize: 14,
            marginBottom: 8
          }}>
            {profile.email}
          </div>
          
          <Divider sx={{ 
            bgcolor: 'var(--border-primary)', 
            height: 2, 
            borderRadius: 1,
            mb: 2
          }} />
          
          <div style={{
            color: 'var(--text-secondary)',
            textAlign: 'center',
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 4
          }}>
            Current Balance
          </div>
          
          <div style={{
            color: 'var(--text-gold)',
            textAlign: 'center',
            fontSize: 32,
            fontWeight: 700,
            textShadow: 'var(--text-shadow)',
            marginBottom: 16
          }}>
            ${profile.wallet}
          </div>
          
          {/* Deposit Section */}
          <div style={{
            background: 'var(--accent-bg)',
            padding: '20px',
            borderRadius: 12,
            border: '1px solid var(--border-secondary)'
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: 'var(--text-primary)', 
              mb: 2,
              textAlign: 'center'
            }}>
              Add Funds
            </Typography>
            <PaystackDeposit
              token={localStorage.getItem('token')}
              onDeposit={wallet => setProfile({ ...profile, wallet })}
            />
          </div>
          
          <Divider sx={{ 
            bgcolor: 'var(--border-secondary)', 
            height: 1, 
            borderRadius: 1
          }} />
          
          {/* Direct Withdraw Section */}
          <div style={{
            background: 'var(--accent-bg)',
            padding: '20px',
            borderRadius: 12,
            border: '1px solid var(--border-secondary)'
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: 'var(--text-primary)', 
              mb: 2,
              textAlign: 'center'
            }}>
              Quick Withdrawal (Local)
            </Typography>
            <TextField
              type="number"
              label="Amount ($)"
              min="1"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              fullWidth
              InputProps={{ 
                style: { 
                  color: 'var(--text-primary)', 
                  fontWeight: 600, 
                  background: 'var(--secondary-bg)', 
                  borderRadius: 8 
                } 
              }}
              InputLabelProps={{
                style: { 
                  color: 'var(--text-secondary)'
                }
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'var(--border-secondary)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--border-primary)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--border-primary)',
                  },
                },
              }}
            />
            <Button 
              onClick={handleWithdraw} 
              disabled={withdrawAmount < 1} 
              fullWidth 
              variant="outlined" 
              sx={{ 
                color: 'var(--text-gold)',
                borderColor: 'var(--border-primary)',
                fontWeight: 600,
                borderRadius: 2,
                padding: '10px 0',
                '&:hover': {
                  borderColor: 'var(--gold-primary)',
                  background: 'var(--accent-bg)'
                },
                '&:disabled': {
                  borderColor: 'var(--border-secondary)',
                  color: 'var(--text-muted)',
                }
              }}
            >
              Withdraw Locally
            </Button>
            {withdrawMsg && (
              <Typography sx={{ 
                color: withdrawMsg.includes('successful') ? 'var(--green-accent)' : 'var(--red-accent)', 
                mt: 1,
                textAlign: 'center',
                fontWeight: 600
              }}>
                {withdrawMsg}
              </Typography>
            )}
          </div>
          
          <Divider sx={{ 
            bgcolor: 'var(--border-secondary)', 
            height: 1, 
            borderRadius: 1
          }} />
          
          {/* Paystack Withdrawal Section */}
          <div style={{
            background: 'var(--accent-bg)',
            padding: '20px',
            borderRadius: 12,
            border: '1px solid var(--border-secondary)'
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: 'var(--text-primary)', 
              mb: 2,
              textAlign: 'center'
            }}>
              Bank Withdrawal (Paystack)
            </Typography>
            <TextField
              label="Account Number"
              name="account_number"
              value={bankDetails.account_number}
              onChange={handleBankChange}
              fullWidth
              InputProps={{ 
                style: { 
                  color: 'var(--text-primary)', 
                  fontWeight: 600, 
                  background: 'var(--secondary-bg)', 
                  borderRadius: 8 
                } 
              }}
              InputLabelProps={{
                style: { 
                  color: 'var(--text-secondary)'
                }
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'var(--border-secondary)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--border-primary)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--border-primary)',
                  },
                },
              }}
            />
            <TextField
              label="Bank Code"
              name="bank_code"
              value={bankDetails.bank_code}
              onChange={handleBankChange}
              fullWidth
              InputProps={{ 
                style: { 
                  color: 'var(--text-primary)', 
                  fontWeight: 600, 
                  background: 'var(--secondary-bg)', 
                  borderRadius: 8 
                } 
              }}
              InputLabelProps={{
                style: { 
                  color: 'var(--text-secondary)'
                }
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'var(--border-secondary)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--border-primary)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--border-primary)',
                  },
                },
              }}
            />
            <TextField
              type="number"
              label="Amount ($)"
              min="1"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              fullWidth
              InputProps={{ 
                style: { 
                  color: 'var(--text-primary)', 
                  fontWeight: 600, 
                  background: 'var(--secondary-bg)', 
                  borderRadius: 8 
                } 
              }}
              InputLabelProps={{
                style: { 
                  color: 'var(--text-secondary)'
                }
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'var(--border-secondary)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--border-primary)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--border-primary)',
                  },
                },
              }}
            />
            <Button 
              onClick={handlePayout} 
              disabled={withdrawAmount < 1 || !bankDetails.account_number || !bankDetails.bank_code} 
              fullWidth 
              variant="contained"
              sx={{ 
                background: 'var(--green-accent)',
                color: 'var(--primary-bg)',
                fontWeight: 700,
                borderRadius: 2,
                padding: '12px 0',
                '&:hover': {
                  background: 'var(--green-secondary)',
                },
                '&:disabled': {
                  background: 'var(--accent-bg)',
                  color: 'var(--text-muted)',
                }
              }}
            >
              Withdraw via Bank
            </Button>
            {payoutMsg && (
              <Typography sx={{ 
                color: payoutMsg.includes('successful') ? 'var(--green-accent)' : 'var(--red-accent)', 
                mt: 1,
                textAlign: 'center',
                fontWeight: 600
              }}>
                {payoutMsg}
              </Typography>
            )}
          </div>
          
          <Divider sx={{ 
            bgcolor: 'var(--border-secondary)', 
            height: 1, 
            borderRadius: 1
          }} />
          
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => navigate('/games')}
            className="gaming-button-primary"
            sx={{ 
              background: 'var(--gradient-gold)',
              color: 'var(--primary-bg)',
              fontWeight: 700,
              fontSize: 16,
              borderRadius: 2,
              padding: '12px 0',
              boxShadow: 'var(--shadow-primary)'
            }}
          >
            Back to Games
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Wallet;
