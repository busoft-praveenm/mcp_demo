import React from 'react';
import { Routes, Route, Link as RouterLink, useLocation, Navigate } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, AppBar, Toolbar, Button, IconButton, Menu, MenuItem } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import CreateTicket from './pages/CreateTicket';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { useAuth } from './context/AuthContext';

const drawerWidth = 240;

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Tickets', icon: <ConfirmationNumberIcon />, path: '/tickets' },
    { text: 'Create Ticket', icon: <AddCircleIcon />, path: '/create-ticket' },
    { text: 'AI Agent', icon: <SmartToyIcon />, path: '/chat' },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, bgcolor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Service Desk MCP Demo
          </Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{user.name}</Typography>
              <IconButton onClick={handleMenu} color="inherit">
                <AccountCircleIcon sx={{ color: 'text.secondary' }} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body2">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column'
          },
        }}
      >
        <Toolbar>
          <Typography variant="h5" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #7C3AED, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            IT Desk
          </Typography>
        </Toolbar>
        <Box sx={{ overflow: 'auto', mt: 2, flexGrow: 1 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 1, px: 2 }}>
                <ListItemButton 
                  component={RouterLink} 
                  to={item.path}
                  selected={location.pathname === item.path}
                  sx={{ 
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(124, 58, 237, 0.15)',
                      color: 'primary.light',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.light',
                      }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} sx={{ '& .MuiListItemText-primary': { fontWeight: 500 } }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        <Box sx={{ p: 2 }}>
          <Button 
            fullWidth 
            color="error" 
            variant="text" 
            startIcon={<LogoutIcon />} 
            onClick={logout}
            sx={{ justifyContent: 'flex-start', px: 2 }}
          >
            Log Out
          </Button>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, overflowY: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
      <Route path="/create-ticket" element={<ProtectedRoute><CreateTicket /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
