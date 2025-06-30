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
  const [timers, setTimers] = useState({});
  const [newTimerName, setNewTimerName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]); // To store { userId, userName } objects

  useEffect(() => {
    socket.emit('register-user', { userId: ADMIN_USER_ID, userName: 'Admin' });

    socket.on('timers', (receivedTimers) => {
      setTimers(receivedTimers);
    });

    socket.on('connected-users', (users) => {
      setConnectedUsers(users);
      if (!selectedUserId && users.length > 0) {
        setSelectedUserId(users[0].userId); // Select the first user by default
      }
    });

    return () => {
      socket.off('timers');
      socket.off('connected-users');
    };
  }, [selectedUserId]);

  const handleCreateTimer = () => {
    if (newTimerName && selectedUserId) {
      socket.emit('create-timer', { timerName: newTimerName, userId: selectedUserId });
      setNewTimerName('');
    }
  };

  const handleStartTimer = (timerId) => {
    socket.emit('start-timer', timerId);
  };

  const handlePauseTimer = (timerId) => {
    socket.emit('pause-timer', timerId);
  };

  const handleStopTimer = (timerId) => {
    socket.emit('stop-timer', timerId);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin View (User: Admin)
        </Typography>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="New Timer Name"
            variant="outlined"
            value={newTimerName}
            onChange={(e) => setNewTimerName(e.target.value)}
            fullWidth
          />
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
            onClick={handleCreateTimer}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Create Timer
          </Button>
        </Box>
        <Grid container spacing={2}>
          {Object.values(timers).map((timer) => (
            <Grid item xs={12} sm={6} md={4} key={timer.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div">
                    {timer.name}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    User: {timer.userName}
                  </Typography>
                  <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    {new Date(timer.time * 1000).toISOString().substr(11, 8)}
                  </Typography>
                  <Box>
                    <IconButton
                      color="success"
                      onClick={() => handleStartTimer(timer.id)}
                      disabled={timer.isRunning}
                    >
                      <PlayArrow />
                    </IconButton>
                    <IconButton
                      color="warning"
                      onClick={() => handlePauseTimer(timer.id)}
                      disabled={!timer.isRunning}
                    >
                      <Pause />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleStopTimer(timer.id)}
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