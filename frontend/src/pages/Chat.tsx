import { useState, useRef, useEffect } from 'react';
import { Box, Typography, Card, TextField, IconButton, Paper, Avatar, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ role: 'user' | 'agent', content: string }[]>([{
    role: 'agent',
    content: "Hi! I'm your AI IT Service Desk assistant. Loading my capabilities..."
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('llama');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/agent/tools`);
        const tools = res.data;
        const toolDescriptions = tools.map((t: any) => `- **${t.name}**: ${t.description}`).join('\n');
        setMessages([{
          role: 'agent',
          content: `Hi! I'm your AI IT Service Desk assistant. I have the following capabilities:\n\n${toolDescriptions}\n\nWhat do you need help with?`
        }]);
      } catch (err) {
        setMessages([{
          role: 'agent',
          content: "Hi! I'm your AI IT Service Desk assistant. I can help you check tickets, assign them, or change their statuses. What do you need?"
        }]);
      }
    };
    fetchCapabilities();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/agent/chat`, {
        message: userMsg,
        authorId: user?.sub,
        model
      });
      setMessages(prev => [...prev, { role: 'agent', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'agent', content: 'Oops, something went wrong connecting to the MCP backend.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>AI Assistant</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>AI Model</InputLabel>
          <Select
            value={model}
            label="AI Model"
            onChange={(e) => setModel(e.target.value)}
          >
            <MenuItem value="gemini">Gemini</MenuItem>
            <MenuItem value="llama">LLaMA (Local)</MenuItem>
            <MenuItem value="claude">Claude</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper', borderRadius: 3 }}>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {messages.map((msg, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 2, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              {msg.role === 'agent' && (
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SmartToyIcon />
                </Avatar>
              )}

              <Paper sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: msg.role === 'user' ? 'primary.dark' : 'rgba(255,255,255,0.05)',
                color: 'white',
              }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
              </Paper>

              {msg.role === 'user' && (
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <PersonIcon />
                </Avatar>
              )}
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}><SmartToyIcon /></Avatar>
              <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                <CircularProgress size={20} />
              </Box>
            </Box>
          )}
          <div ref={endRef} />
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <TextField
            fullWidth
            placeholder="Ask me to assign ticket #2 to an IT admin..."
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton color="primary" onClick={handleSend} disabled={!input.trim() || loading}>
                    <SendIcon />
                  </IconButton>
                ),
                sx: { borderRadius: 3 }
              }
            }}
          />
        </Box>
      </Card>
    </Box>
  );
}
