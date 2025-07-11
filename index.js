require('dotenv').config();
require('./config/dBConfig');
const http = require('http');
const {Server} = require('socket.io');

const express = require('express'); 

const app = express();  
const server = http.createServer(app);
const io = new Server(server,{
  cors:{
    origin: "*",
    methods: ["GET","POST"]
  }
});
require('./sockets/sockets')(io)

const authRoutes = require('./appRoutes/AuthRoutes');
const videoRoute = require('./appRoutes/VideoRoutes');


app.use(express.json());            
app.use((req, res, next) => {
  console.log(`📨 Incoming: ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);   
app.use('/api/videos', videoRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {            
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('If you see "Connected to PostgreSQL!" above, it works!');
});
// Sockets 
const SocketPORT =  4001;

server.listen(SocketPORT, () => {
  console.log(`✅ Server running at http://localhost:${SocketPORT}`);
});