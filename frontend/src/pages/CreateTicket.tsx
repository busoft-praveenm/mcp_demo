import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, MenuItem, Grid } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CreateTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
  });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users`);
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/tickets`, { ...formData, authorId: user?.sub });
      navigate('/tickets');
    } catch (error) {
      console.error('Error creating ticket', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>Submit New Ticket</Typography>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Priority"
                  name="priority"
                  select
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Assign To (Optional)"
                  name="assigneeId"
                  select
                  value={formData.assigneeId}
                  onChange={handleChange}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.name} ({u.role})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={6}
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  endIcon={<SendIcon />}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Submit Ticket
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
