require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketio = require('socket.io');
const { ensureDefaultUsers } = require('./config/defaultUsers');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

app.set('io', io);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api', limiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/admin', require('./routes/admin'));

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('Admin joined admin-room');
  });

  socket.on('new-activity', async (activityData) => {
    io.to('admin-room').emit('activity-update', activityData);
  });

  socket.on('project-update', (projectData) => {
    io.to('admin-room').emit('project-changed', projectData);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

async function startServer() {
  try {
    await ensureDefaultUsers();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`WorkPulse in-memory server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
