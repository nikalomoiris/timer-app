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

let activeItems = {};
const ADMIN_USER_ID = 'admin'; // Hardcoded admin user ID for now

let connectedUsers = {}; // Map userId to { userId, userName }
let userNamesToIds = {}; // Map userName to userId for uniqueness check

// Helper function to send active items to a specific user
const sendActiveItemsToUser = (socket) => {
  if (!socket.userId) return; // User not registered yet

  let itemsToSend;
  if (socket.userId === ADMIN_USER_ID) {
    itemsToSend = Object.values(activeItems).map(item => ({
      ...item,
      userName: connectedUsers[item.userId] ? connectedUsers[item.userId].userName : 'Unknown User'
    })); // Admin sees all items with user names
  } else {
    itemsToSend = Object.values(activeItems).filter(item => item.userId === socket.userId).map(item => ({
      ...item,
      userName: connectedUsers[item.userId] ? connectedUsers[item.userId].userName : 'Unknown User'
    }));
  }
  socket.emit('active-items', itemsToSend);
};

// Helper function to emit active items to all connected clients
const emitAllActiveItems = () => {
  io.sockets.sockets.forEach(socket => {
    sendActiveItemsToUser(socket);
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

    sendActiveItemsToUser(socket); // Send initial active items to the newly registered user
    emitAllActiveItems(); // Notify all clients (especially admin) about new user
  });

  socket.on('create-item', ({ name, type, duration, userId }) => {
    const actualUserId = userId || socket.userId; // Use provided userId or socket's userId
    if (!actualUserId) {
      console.error('No userId provided for item creation');
      return;
    }

    let newItem;
    if (type === 'timer') {
      newItem = { id: Date.now(), name, type, time: 0, isRunning: false, userId: actualUserId };
    } else if (type === 'countdown') {
      const endTime = Date.now() + duration * 1000; // duration in seconds
      newItem = { id: Date.now(), name, type, duration, endTime, remainingTime: duration, isRunning: false, userId: actualUserId };
    } else {
      console.error('Unknown item type:', type);
      return;
    }

    activeItems[newItem.id] = newItem;
    emitAllActiveItems(); // Emit updated active items to all relevant users
  });

  socket.on('start-item', (itemId) => {
    const item = activeItems[itemId];
    if (item.type === 'countdown') {
      item.endTime = Date.now() + item.remainingTime * 1000; // Recalculate endTime on start
    }
    item.isRunning = true;
    emitAllActiveItems(); // Emit updated active items to all relevant users
  });

  socket.on('pause-item', (itemId) => {
    const item = activeItems[itemId];
    if (item.type === 'countdown') {
      item.remainingTime = Math.max(0, (item.endTime - Date.now()) / 1000); // Capture remainingTime on pause
    }
    item.isRunning = false;
    emitAllActiveItems(); // Emit updated active items to all relevant users
  });

  socket.on('stop-item', (itemId) => {
    delete activeItems[itemId];
    emitAllActiveItems(); // Emit updated active items to all relevant users
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (socket.userId) {
      delete userNamesToIds[connectedUsers[socket.userId].userName];
      delete connectedUsers[socket.userId];
      emitAllActiveItems(); // Notify all clients (especially admin) about user disconnection
    }
  });
});

setInterval(() => {
  Object.keys(activeItems).forEach((itemId) => {
    const item = activeItems[itemId];
    if (item.isRunning) {
      if (item.type === 'timer') {
        item.time++;
      } else if (item.type === 'countdown') {
        // Client-side handles smooth remainingTime updates
        // Server only stops it when it reaches 0
        if (item.remainingTime <= 0) {
          item.isRunning = false; // Stop countdown when it reaches 0
        }
      }
    }
  });
  emitAllActiveItems(); // Emit updated active items to all relevant users
}, 100);

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});