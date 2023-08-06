const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;
let numUsers = 0;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Load message history from file a.json (if exists)
let messages = [];
if (fs.existsSync('a.json')) {
  const data = fs.readFileSync('a.json', 'utf8');
  messages = JSON.parse(data);
}

io.on('connection', (socket) => {
  console.log('User connected');
  numUsers++;
  io.emit('userCount', numUsers);


  socket.emit('history', messages);

  socket.on('disconnect', () => {
    console.log('User disconnected');
    numUsers--;
    io.emit('userCount', numUsers);
  });

  socket.on('message', (data) => {
    const timestamp = new Date().toLocaleTimeString();
    const messageWithTimestamp = {
      content: data,
      timestamp: timestamp,
      likes: 0,
      dislikes: 0,
      reports: 0,
    };
    
    messages.push(messageWithTimestamp);
    io.emit('message', messageWithTimestamp);

    fs.writeFileSync('a.json', JSON.stringify(messages), 'utf8');
  });

  socket.on('like', (messageIndex) => {
    if (messages[messageIndex]) {
      messages[messageIndex].likes++;
      io.emit('update', messages);
      fs.writeFileSync('a.json', JSON.stringify(messages), 'utf8');
    }
  });

  socket.on('dislike', (messageIndex) => {
    if (messages[messageIndex]) {
      messages[messageIndex].dislikes++;
      io.emit('update', messages);
      fs.writeFileSync('a.json', JSON.stringify(messages), 'utf8');
    }
  });

  socket.on('report', (messageIndex) => {
    if (messages[messageIndex]) {
      messages[messageIndex].reports++;
      fs.appendFileSync('ma.txt', `${messages[messageIndex].timestamp}: ${messages[messageIndex].content}\n`, 'utf8');
      io.emit('update', messages);
      fs.writeFileSync('a.json', JSON.stringify(messages), 'utf8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
