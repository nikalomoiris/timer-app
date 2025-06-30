const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

let timers = {};
const ADMIN_USER_ID = 'admin'; // Hardcoded admin user ID for now

let connectedUsers = {}; // Map userId to { userId, userName }
let userNamesToIds = {}; // Map userName to userId for uniqueness check

// Helper function to send timers to a specific user
const sendTimersToUser = (socket) => {
  if (!socket.userId) return; // User not registered yet

  let timersToSend;
  if (socket.userId === ADMIN_USER_ID) {
    timersToSend = Object.values(timers).map(timer => ({
      ...timer,
      userName: connectedUsers[timer.userId] ? connectedUsers[timer.userId].userName : 'Unknown User'
    })); // Admin sees all timers with user names
  } else {
    timersToSend = Object.values(timers).filter(timer => timer.userId === socket.userId).map(timer => ({
      ...timer,
      userName: connectedUsers[timer.userId] ? connectedUsers[timer.userId].userName : 'Unknown User'
    }));
  }
  socket.emit('timers', timersToSend);
};

// Helper function to emit timers to all connected clients
const emitAllTimers = () => {
  io.sockets.sockets.forEach(socket => {
    sendTimersToUser(socket);
  });
  // Also emit the list of connected users to the admin
  const usersArray = Object.values(connectedUsers);
  io.to(ADMIN_USER_ID).emit('connected-users', usersArray);
};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('register-user', ({ userId, userName }) => {
    if (userNamesToIds[userName] && userNamesToIds[userName] !== userId) {
      // User name already taken by another user
      socket.emit('registration-error', 'User name already taken.');
      return;
    }

    socket.userId = userId;
    socket.userName = userName; // Store userName on socket for easy access
    socket.join(userId); // Join a room specific to the user ID

    connectedUsers[userId] = { userId, userName };
    userNamesToIds[userName] = userId;

    sendTimersToUser(socket); // Send initial timers to the newly registered user
    emitAllTimers(); // Notify all clients (especially admin) about new user
  });

  socket.on('create-timer', ({ timerName, userId }) => {
    const actualUserId = userId || socket.userId; // Use provided userId or socket's userId
    if (!actualUserId) {
      console.error('No userId provided for timer creation');
      return;
    }
    const newTimer = { id: Date.now(), name: timerName, time: 0, isRunning: false, userId: actualUserId };
    timers[newTimer.id] = newTimer;
    emitAllTimers(); // Emit updated timers to all relevant users
  });

  socket.on('start-timer', (timerId) => {
    timers[timerId].isRunning = true;
    emitAllTimers(); // Emit updated timers to all relevant users
  });

  socket.on('pause-timer', (timerId) => {
    timers[timerId].isRunning = false;
    emitAllTimers(); // Emit updated timers to all relevant users
  });

  socket.on('stop-timer', (timerId) => {
    delete timers[timerId];
    emitAllTimers(); // Emit updated timers to all relevant users
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (socket.userId) {
      delete userNamesToIds[connectedUsers[socket.userId].userName];
      delete connectedUsers[socket.userId];
      emitAllTimers(); // Notify all clients (especially admin) about user disconnection
    }
  });
});

setInterval(() => {
  Object.keys(timers).forEach((timerId) => {
    if (timers[timerId].isRunning) {
      timers[timerId].time++;
    }
  });
  emitAllTimers(); // Emit updated timers to all relevant users
}, 1000);

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
