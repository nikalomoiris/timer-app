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
  console.log(`[Socket.IO] Connection established: ${socket.id}`);

  socket.on('register-user', ({ userId, userName }) => {
    console.log(`[Socket.IO] Event: register-user, UserID: ${userId}, UserName: ${userName}`);
    if (userNamesToIds[userName] && userNamesToIds[userName] !== userId) {
      console.warn(`[Socket.IO] Registration failed for ${userName}: name already taken.`);
      socket.emit('registration-error', 'User name already taken.');
      return;
    }

    socket.userId = userId;
    socket.userName = userName;
    socket.join(userId);

    connectedUsers[userId] = { userId, userName };
    userNamesToIds[userName] = userId;

    sendActiveItemsToUser(socket);
    emitAllActiveItems();
  });

  socket.on('create-item', ({ name, type, duration, userId }) => {
    const actualUserId = userId || socket.userId;
    if (!actualUserId) {
      console.error('No userId provided for item creation');
      return;
    }

    let newItem;
    if (type === 'timer') {
      // baseTime stores the total elapsed time in ms when paused.
      // startTime stores the timestamp of the last time it was started.
      newItem = { id: Date.now(), name, type, userId: actualUserId, isRunning: false, baseTime: 0, startTime: 0 };
    } else if (type === 'countdown') {
      newItem = { id: Date.now(), name, type, duration, remainingTime: duration, isRunning: false, userId: actualUserId };
    } else {
      console.error('Unknown item type:', type);
      return;
    }

    activeItems[newItem.id] = newItem;
    console.log(`[Socket.IO] Item created: ${JSON.stringify(newItem)}`);
    emitAllActiveItems();
  });

  socket.on('start-item', (itemId) => {
    console.log(`[Socket.IO] Event: start-item, ItemID: ${itemId}`);
    const item = activeItems[itemId];
    if (!item) return;

    if (item.type === 'timer') {
      item.startTime = Date.now(); // Set start time to now
    } else if (item.type === 'countdown') {
      // Set the definitive end time based on remaining time
      item.endTime = Date.now() + item.remainingTime * 1000;
    }
    item.isRunning = true;
    emitAllActiveItems();
  });

  socket.on('pause-item', (itemId) => {
    console.log(`[Socket.IO] Event: pause-item, ItemID: ${itemId}`);
    const item = activeItems[itemId];
    if (!item || !item.isRunning) return;

    if (item.type === 'timer') {
      // Add the time elapsed since the last start to the base time
      item.baseTime += Date.now() - item.startTime;
    } else if (item.type === 'countdown') {
      // Calculate and store the remaining time
      item.remainingTime = Math.max(0, (item.endTime - Date.now()) / 1000);
    }
    item.isRunning = false;
    emitAllActiveItems();
  });

  socket.on('stop-item', (itemId) => {
    console.log(`[Socket.IO] Event: stop-item, ItemID: ${itemId}`);
    delete activeItems[itemId];
    emitAllActiveItems();
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Disconnected: ${socket.id}, UserID: ${socket.userId}`);
    if (socket.userId && connectedUsers[socket.userId]) {
      delete userNamesToIds[connectedUsers[socket.userId].userName];
      delete connectedUsers[socket.userId];
      emitAllActiveItems();
    }
  });
});

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});