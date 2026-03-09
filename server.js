import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

import ConnectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import menurouter from './routes/menuroutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reservationsRoutes from './routes/reservationRoutes.js';
import Info from './controllers/Info.js';

// Admin routes
import menuRoutes from './routes/admin/menuRoutes.js';
import reservationRoutes from './routes/admin/reservationRoutes.js';
import staffRoutes from './routes/admin/staffRoutes.js';
import inventoryRoutes from './routes/admin/inventoryRoutes.js';

dotenv.config();
ConnectDB();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: 'https://seoul-brew-cafe-frontend.vercel.app' ||'https://seoulbrewcafes.netlify.app', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── Admin Routes ───────────────────────────────────────────────────────────
app.use('/api/menu', menuRoutes);
app.use('/api', reservationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/inventory', inventoryRoutes);

// ── User Routes ────────────────────────────────────────────────────────────
app.use('/api', userRoutes);
app.use('/api/menu', menurouter);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api', Info);

// ── HTTP + Socket.io ───────────────────────────────────────────────────────
const server = http.createServer(app);


export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

// Attach io to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on Port: ${PORT}`));