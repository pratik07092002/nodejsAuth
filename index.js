require('dotenv').config();
require('./config/dBConfig');
const express = require('express'); 

const app = express();  
const authRoutes = require('./authRoutes/routes');
app.use(express.json());            
app.use((req, res, next) => {
  console.log(`📨 Incoming: ${req.method} ${req.url}`);
  next();
});
app.use('/api/auth', authRoutes);   

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {            
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('If you see "Connected to PostgreSQL!" above, it works!');
});