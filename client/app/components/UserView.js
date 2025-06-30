'use client';

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
} from '@mui/material';

const socket = io('http://localhost:3001');

const UserView = () => {
  const [timers, setTimers] = useState({});

  useEffect(() => {
    socket.on('timers', (timers) => {
      setTimers(timers);
    });

    return () => {
      socket.off('timers');
    };
  }, []);

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User View
        </Typography>
        <Grid container spacing={2}>
          {Object.values(timers).map((timer) => (
            <Grid item xs={12} sm={6} md={4} key={timer.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div">
                    {timer.name}
                  </Typography>
                  <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    {new Date(timer.time * 1000).toISOString().substr(11, 8)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default UserView;