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
import menuRoutes from './routes/admin/menuRoutes.js';
import reservationRoutes from './routes/admin/reservationRoutes.js';
import staffRoutes from './routes/admin/staffRoutes.js';
import inventoryRoutes from './routes/admin/inventoryRoutes.js';
import s3Route from './routes/s3.js';

dotenv.config();
ConnectDB();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const allowedOrigins = [
  "https://seoul-brew-cafe-frontend.vercel.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ✅ Handle preflight requests FIRST, before any routes
// app.options('/{*any}', cors(corsOptions));
// app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// HTTp scoket.io
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

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

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/s3', s3Route);

// Admin
app.use('/api/menu', menuRoutes);
app.use('/api', reservationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/inventory', inventoryRoutes);

// User
app.use('/api', userRoutes);
app.use('/api/menu/user', menurouter);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api', Info);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on Port: ${PORT}`));