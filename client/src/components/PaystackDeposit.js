import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';


const PaystackDeposit = ({ token, onDeposit }) => {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  // Get user email from Firebase Auth
  React.useEffect(() => {
    const user = auth.currentUser;
    if (user) setEmail(user.email);
  }, []);

  const handleVerifyPayment = async (reference, amount) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage('Not authenticated');
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch('/api/user/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reference, amount })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Deposit successful!');
        if (onDeposit) onDeposit(data.wallet);
      } else {
        setMessage(data.message || 'Deposit failed.');
      }
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
