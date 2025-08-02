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
    console.log(`[UserView] Component mounted. UserID: ${currentUserId}, UserName: ${currentUserName}`);

    if (!currentUserId) {
      currentUserId = uuidv4();
      localStorage.setItem('userId', currentUserId);
      console.log(`[UserView] New user ID generated and stored: ${currentUserId}`);
    }
    setUserId(currentUserId);

    if (!currentUserName) {
      console.log('[UserView] User name not found, opening dialog.');
      setOpenNameDialog(true);
    } else {
      setUserName(currentUserName);
      console.log(`[UserView] Registering user: ${currentUserName}`);
      socket.emit('register-user', { userId: currentUserId, userName: currentUserName });
    }

    socket.on('active-items', (items) => {
      console.log('[UserView] Received active-items:', items);
      setActiveItems((prevItems) => {
        const newItems = {};
        // Add/update items from server
        items.forEach((receivedItem) => {
          if (prevItems[receivedItem.id] && receivedItem.type === 'countdown' && receivedItem.isRunning) {
            // If countdown is running, preserve client's smoothly updated remainingTime
            newItems[receivedItem.id] = { ...receivedItem, remainingTime: prevItems[receivedItem.id].remainingTime };
          } else {
            newItems[receivedItem.id] = receivedItem;
          }
        });

        // Remove items that are no longer present on the server
        Object.keys(prevItems).forEach(itemId => {
          if (!newItems[itemId]) {
            delete newItems[itemId];
          }
        });

        return newItems;
      });
    });

    socket.on('registration-error', (message) => {
      console.warn(`[UserView] Registration error: ${message}`);
      setRegistrationError(message);
      setOpenNameDialog(true); // Re-open dialog on error
    });

    let animationFrameId;

    const updateProgress = () => {
      setActiveItems((prevItems) => {
        const newItems = { ...prevItems };
        Object.values(newItems).forEach((item) => {
          if (item.isRunning) {
            if (item.type === 'timer') {
              const elapsed = Date.now() - item.startTime;
              item.displayTime = item.baseTime + elapsed;
            } else if (item.type === 'countdown') {
              item.displayTime = Math.max(0, item.endTime - Date.now());
            }
          } else {
            if (item.type === 'timer') {
              item.displayTime = item.baseTime;
            } else if (item.type === 'countdown') {
              item.displayTime = item.remainingTime * 1000;
            }
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
                    {item.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({item.type})
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      mb: 1.5,
                      fontFamily: 'monospace',
                      color: item.type === 'countdown' && item.displayTime <= 0 ? 'error.main' : 'text.secondary',
                    }}
                  >
                    {new Date(item.displayTime || 0).toISOString().substr(11, 8)}
                  </Typography>
                  {item.type === 'countdown' && (
                    <Box sx={{ width: '100%', mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={item.type === 'countdown' ? ((item.duration * 1000 - (item.displayTime || 0)) / (item.duration * 1000)) * 100 : 0}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: 'lightgrey',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor:
                              (item.displayTime || 0) / (item.duration * 1000) > 0.2
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