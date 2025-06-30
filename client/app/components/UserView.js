'use client';

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid'; // Import uuid
import LinearProgress from '@mui/material/LinearProgress';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

const socket = io('http://localhost:3001');

const UserView = () => {
  const [activeItems, setActiveItems] = useState({});
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [openNameDialog, setOpenNameDialog] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [registrationError, setRegistrationError] = useState('');

  useEffect(() => {
    let currentUserId = localStorage.getItem('userId');
    let currentUserName = localStorage.getItem('userName');

    if (!currentUserId) {
      currentUserId = uuidv4();
      localStorage.setItem('userId', currentUserId);
    }
    setUserId(currentUserId);

    if (!currentUserName) {
      setOpenNameDialog(true);
    } else {
      setUserName(currentUserName);
      socket.emit('register-user', { userId: currentUserId, userName: currentUserName });
    }

    socket.on('active-items', (items) => {
      setActiveItems((prevItems) => {
        const newItems = { ...prevItems };
        items.forEach((receivedItem) => {
          if (newItems[receivedItem.id] && newItems[receivedItem.id].type === 'countdown' && newItems[receivedItem.id].isRunning) {
            // If countdown is already running on client, don't overwrite remainingTime from server
            newItems[receivedItem.id] = { ...newItems[receivedItem.id], ...receivedItem, remainingTime: newItems[receivedItem.id].remainingTime };
          } else {
            newItems[receivedItem.id] = receivedItem;
          }
        });
        return newItems;
      });
    });

    socket.on('registration-error', (message) => {
      setRegistrationError(message);
      setOpenNameDialog(true); // Re-open dialog on error
    });

    let animationFrameId;

    const updateProgress = () => {
      setActiveItems((prevItems) => {
        const newItems = { ...prevItems };
        Object.values(newItems).forEach((item) => {
          if (item.type === 'countdown' && item.isRunning) {
            const now = Date.now();
            const elapsed = (now - (item.endTime - item.duration * 1000)) / 1000; // Time elapsed since start
            item.remainingTime = Math.max(0, item.duration - elapsed);
          } else if (item.type === 'countdown' && !item.isRunning && item.remainingTime <= 0) {
            item.remainingTime = 0; // Ensure it stays at 0 if already finished
          }
        });
        return newItems;
      });
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      socket.off('active-items');
      socket.off('registration-error');
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleNameSubmit = () => {
    if (tempUserName.trim() === '') {
      setRegistrationError('User name cannot be empty.');
      return;
    }
    localStorage.setItem('userName', tempUserName);
    setUserName(tempUserName);
    setOpenNameDialog(false);
    setRegistrationError('');
    socket.emit('register-user', { userId, userName: tempUserName });
  };

  if (!userId) {
    return <Typography>Loading user...</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User View ({userName || 'Not Registered'})
        </Typography>
        <Grid container spacing={2}>
          {Object.values(activeItems).map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div">
                    {item.name} ({item.type})
                  </Typography>
                  <Typography
                    sx={{
                      mb: 1.5,
                      color: item.type === 'countdown' && item.remainingTime <= 0 ? 'error.main' : 'text.secondary',
                    }}
                  >
                    {item.type === 'timer'
                      ? new Date(item.time * 1000).toISOString().substr(11, 8)
                      : new Date(item.remainingTime * 1000).toISOString().substr(11, 8)}
                  </Typography>
                  {item.type === 'countdown' && (
                    <Box sx={{ width: '100%', mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={item.type === 'countdown'
                          ? item.isRunning
                            ? Math.max(0, Math.min(100, (item.duration - (item.endTime - Date.now()) / 1000) / item.duration * 100))
                            : (item.duration - item.remainingTime) / item.duration * 100
                          : 0}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: 'lightgrey',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor:
                              (item.duration - (item.endTime - Date.now()) / 1000) / item.duration * 100 < 80
                                ? 'success.main'
                                : 'warning.main',
                          },
                        }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Dialog open={openNameDialog} disableEscapeKeyDown>
        <DialogTitle>Enter Your Name</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter a name to identify yourself. This name will be visible to the admin.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Your Name"
            type="text"
            fullWidth
            variant="standard"
            value={tempUserName}
            onChange={(e) => setTempUserName(e.target.value)}
            error={!!registrationError}
            helperText={registrationError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNameSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserView;