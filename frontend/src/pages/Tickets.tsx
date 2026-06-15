import { useState, useEffect } from 'react';
import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Select, MenuItem } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';

export default function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/tickets`);
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/tickets/${id}`, { status: newStatus });
      fetchTickets();
    } catch (error) {
      console.error('Failed to update ticket status', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'info';
      case 'HIGH': return 'warning';
      case 'URGENT': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>All Tickets</Typography>
      <TableContainer component={Card} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Creator</TableCell>
              <TableCell>Assignee</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">No tickets found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>#{ticket.id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{ticket.title}</TableCell>
                  <TableCell>
                    {ticket.author ? (
                      <Chip size="small" icon={<PersonIcon />} label={ticket.author.name} variant="outlined" />
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {ticket.assignee ? (
                      <Chip size="small" icon={<PersonIcon />} label={ticket.assignee.name} color="secondary" variant="outlined" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">Unassigned</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      sx={{ 
                        fontSize: '0.8rem', 
                        height: 32,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="OPEN">Open</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="RESOLVED">Resolved</MenuItem>
                      <MenuItem value="CLOSED">Closed</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={ticket.priority} color={getPriorityColor(ticket.priority) as any} />
                  </TableCell>
                  <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary">
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
