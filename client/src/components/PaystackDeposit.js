import React, { useState } from 'react';
import axios from 'axios';


const PaystackDeposit = ({ token, onDeposit }) => {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  // Get user email from profile API
  React.useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmail(res.data.email);
      } catch {}
    };
    fetchEmail();
  }, [token]);

  const handleVerifyPayment = async (reference, amount) => {
    try {
      const res = await axios.post('/api/user/wallet/deposit', {
        reference,
        amount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Deposit successful!');
      if (onDeposit) onDeposit(res.data.wallet);
    } catch (err) {
      setMessage('Deposit failed.');
    }
    setLoading(false);
  };

  const handleDeposit = () => {
    setLoading(true);
    setMessage('');
    if (!window.PaystackPop) {
      setMessage('Paystack not loaded. Please refresh the page.');
      setLoading(false);
      return;
    }
    if (!email) {
      setMessage('User email not found.');
      setLoading(false);
      return;
    }
    const handler = window.PaystackPop.setup({
      key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
      email,
      amount: amount * 100,
      currency: 'NGN',
      callback: function(response) {
        handleVerifyPayment(response.reference, amount);
      },
      onClose: function() {
        setLoading(false);
        setMessage('Payment window closed.');
      }
    });
    handler.openIframe();
  };

  return (
    <div style={{ maxWidth: 300, margin: 'auto', padding: 20, border: '1px solid #eee', borderRadius: 8 }}>
      <h3>Deposit to Wallet</h3>
      <input
        type="number"
        min="1"
        value={amount}
        onChange={e => setAmount(Number(e.target.value))}
        placeholder="Amount (NGN)"
        style={{ width: '100%', marginBottom: 10 }}
      />
      <button onClick={handleDeposit} disabled={loading || amount < 1} style={{ width: '100%' }}>
        {loading ? 'Processing...' : 'Deposit'}
      </button>
      {message && <div style={{ marginTop: 10 }}>{message}</div>}
    </div>
  );
};

export default PaystackDeposit;
