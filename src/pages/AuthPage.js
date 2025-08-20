import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const url = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email: form.email, password: form.password } : form;
      const res = await axios.post(url, payload);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        {isLogin ? 'Login' : 'Register'}
      </Typography>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <TextField fullWidth margin="normal" label="Username" name="username" value={form.username} onChange={handleChange} />
        )}
        <TextField fullWidth margin="normal" label="Email" name="email" value={form.email} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="Password" name="password" type="password" value={form.password} onChange={handleChange} />
        {error && <Typography color="error">{error}</Typography>}
        <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>
          {isLogin ? 'Login' : 'Register'}
        </Button>
      </form>
      <Button fullWidth sx={{ mt: 2 }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </Button>
    </Paper>
  );
}

export default AuthPage;
