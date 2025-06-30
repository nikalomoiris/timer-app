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

io.on('connection', (socket) => {
  console.log('a user connected');

  // Send the current timers to the new client
  socket.emit('timers', timers);

  socket.on('create-timer', (timerName) => {
    const newTimer = { id: Date.now(), name: timerName, time: 0, isRunning: false };
    timers[newTimer.id] = newTimer;
    io.emit('timers', timers);
  });

  socket.on('start-timer', (timerId) => {
    timers[timerId].isRunning = true;
    io.emit('timers', timers);
  });

  socket.on('pause-timer', (timerId) => {
    timers[timerId].isRunning = false;
    io.emit('timers', timers);
  });

  socket.on('stop-timer', (timerId) => {
    delete timers[timerId];
    io.emit('timers', timers);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

setInterval(() => {
  Object.keys(timers).forEach((timerId) => {
    if (timers[timerId].isRunning) {
      timers[timerId].time++;
    }
  });
  io.emit('timers', timers);
}, 1000);

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
