import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { sequelize } from './config/database.js';
// Import models to initialize associations
import './models/index.js';
import outageRoutes from './routes/outages.js';
import technicianRoutes from './routes/technicians.js';
import locationRoutes from './routes/location.js';
import voiceRoutes from './routes/voice.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'member2-outage-system' });
});

// API Routes
app.use('/api/member2/outages', outageRoutes(io));
app.use('/api/member2/technicians', technicianRoutes(io));
app.use('/api/member2/location', locationRoutes(io));
app.use('/api/member2/voice', voiceRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe-outages', () => {
    socket.join('outages');
    console.log('Client subscribed to outages');
  });

  socket.on('subscribe-technicians', () => {
    socket.join('technicians');
    console.log('Client subscribed to technicians');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database (use { alter: true } in dev, remove in production)
    await sequelize.sync({ alter: false });
    console.log('Database models synchronized.');

    httpServer.listen(PORT, () => {
      console.log(`Member 2 Outage System running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };