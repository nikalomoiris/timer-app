'use client';

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import {
  Container,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { PlayArrow, Pause, Stop } from '@mui/icons-material';

const socket = io('http://localhost:3001');
const ADMIN_USER_ID = 'admin'; // Hardcoded admin user ID

const AdminView = () => {
  const [activeItems, setActiveItems] = useState({});
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('timer'); // 'timer' or 'countdown'
  const [countdownDuration, setCountdownDuration] = useState(60); // Default to 60 seconds
  const [selectedUserId, setSelectedUserId] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]); // To store { userId, userName } objects

  useEffect(() => {
    socket.emit('register-user', { userId: ADMIN_USER_ID, userName: 'Admin' });

    socket.on('active-items', (receivedItems) => {
      setActiveItems(receivedItems);
    });

    socket.on('connected-users', (users) => {
      setConnectedUsers(users);
      if (!selectedUserId && users.length > 0) {
        setSelectedUserId(users[0].userId); // Select the first user by default
      }
    });

    return () => {
      socket.off('active-items');
      socket.off('connected-users');
    };
  }, [selectedUserId]);

  const handleCreateItem = () => {
    if (newItemName && selectedUserId) {
      socket.emit('create-item', { name: newItemName, type: newItemType, duration: countdownDuration, userId: selectedUserId });
      setNewItemName('');
      setCountdownDuration(60); // Reset duration
    }
  };

  const handleStartItem = (itemId) => {
    socket.emit('start-item', itemId);
  };

  const handlePauseItem = (itemId) => {
    socket.emit('pause-item', itemId);
  };

  const handleStopItem = (itemId) => {
    socket.emit('stop-item', itemId);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin View (User: Admin)
        </Typography>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Name"
            variant="outlined"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            fullWidth
          />
          <FormControl variant="outlined" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value)}
              label="Type"
            >
              <MenuItem value="timer">Timer</MenuItem>
              <MenuItem value="countdown">Countdown</MenuItem>
            </Select>
          </FormControl>
          {newItemType === 'countdown' && (
            <TextField
              label="Duration (seconds)"
              variant="outlined"
              type="number"
              value={countdownDuration}
              onChange={(e) => setCountdownDuration(Number(e.target.value))}
              sx={{ minWidth: 150 }}
            />
          )}
          <FormControl variant="outlined" sx={{ minWidth: 120 }}>
            <InputLabel>User</InputLabel>
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              label="User"
            >
              {connectedUsers.map((user) => (
                <MenuItem key={user.userId} value={user.userId}>
                  {user.userName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateItem}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Create Item
          </Button>
        </Box>
        <Grid container spacing={2}>
          {Object.values(activeItems).map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div">
                    {item.name} ({item.type})
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    User: {item.userName}
                  </Typography>
                  <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    {item.type === 'timer'
                      ? new Date(item.time * 1000).toISOString().substr(11, 8)
                      : new Date(item.remainingTime * 1000).toISOString().substr(11, 8)}
                  </Typography>
                  <Box>
                    <IconButton
                      color="success"
                      onClick={() => handleStartItem(item.id)}
                      disabled={item.isRunning || (item.type === 'countdown' && item.remainingTime === 0)}
                    >
                      <PlayArrow />
                    </IconButton>
                    <IconButton
                      color="warning"
                      onClick={() => handlePauseItem(item.id)}
                      disabled={!item.isRunning}
                    >
                      <Pause />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleStopItem(item.id)}
                    >
                      <Stop />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default AdminView;