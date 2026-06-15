import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState<{open: number, inProgress: number, resolved: number} | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/tickets/stats`);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  if (!stats) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  const statCards = [
    { title: 'Open Tickets', count: stats.open, icon: <ConfirmationNumberIcon sx={{ fontSize: 40, color: '#3B82F6' }} />, color: 'rgba(59, 130, 246, 0.1)' },
    { title: 'In Progress', count: stats.inProgress, icon: <AutorenewIcon sx={{ fontSize: 40, color: '#F59E0B' }} />, color: 'rgba(245, 158, 11, 0.1)' },
    { title: 'Resolved', count: stats.resolved, icon: <CheckCircleOutlineIcon sx={{ fontSize: 40, color: '#10B981' }} />, color: 'rgba(16, 185, 129, 0.1)' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>Overview</Typography>
      <Grid container spacing={4}>
        {statCards.map((stat, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              p: 2,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: stat.color, mr: 3 }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>{stat.count}</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>{stat.title}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>System Status</Typography>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              MCP API Server is Online. Agents can connect to the SSE endpoint to manage tickets.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
