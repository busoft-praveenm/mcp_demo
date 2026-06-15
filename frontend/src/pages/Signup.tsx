import { useState } from 'react';
import { Box, Card, Typography, TextField, Button, Link } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/signup`, { name, email, password });
      login(res.data.access_token, res.data.user);
    } catch (err) {
      setError('Registration failed. Email might be in use.');
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, textAlign: 'center', color: 'primary.main' }}>Create Account</Typography>
        <Typography variant="body2" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>Sign up to the IT Service Desk.</Typography>
        {error && <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>{error}</Typography>}
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Full Name" margin="normal" value={name} onChange={e => setName(e.target.value)} required />
          <TextField fullWidth label="Email" type="email" margin="normal" value={email} onChange={e => setEmail(e.target.value)} required />
          <TextField fullWidth label="Password" type="password" margin="normal" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 3, mb: 2 }}>Sign Up</Button>
        </form>
        <Typography align="center" variant="body2">
          Already have an account? <Link component={RouterLink} to="/login" color="secondary">Log In</Link>
        </Typography>
      </Card>
    </Box>
  );
}
