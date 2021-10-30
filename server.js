const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');
const randomColor = require('randomcolor');
const createBoard = require('./create-board');
const createCooldown = require('./create-cooldown');

const app = express();

app.use(express.static(`${__dirname}/client`));

app.get('/', function(request, response) {
    response.sendFile(path.join(`${__dirname}/client`, 'index.html'));
});

const server = http.createServer(app);
const io = socketio(server);

server.on('error', (err) => {
  console.error(err);
});

server.listen(8080, () => {
  console.log('server is ready');
});

const { clear, getBoard, makeTurn } = createBoard(20);

io.on('connection', (sock) => {
  console.log('someone connected')
  sock.emit('message','You are connected')
  sock.on('message', (text) => io.emit('message', text));
  const color = randomColor();
  const cooldown = createCooldown(2000);
  sock.emit('board', getBoard());

  sock.on('turn', ({ x, y }) => {
    if (cooldown()) {
      const playerWon = makeTurn(x, y, color);
      io.emit('turn', { x, y, color });

      if (playerWon) {
        sock.emit('message', 'You Won!');
        io.emit('message', 'New Round');
        clear();
        io.emit('board');
      }
    }
  });
});
