import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import menurouter from './routes/menuroutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reservationsRoutes from './routes/reservationRoutes.js';
import Info from './controllers/Info.js';
import ConnectDB from './config/db.js';

import userRoutes from './routes/userRoutes.js'

dotenv.config(); // Must be at the very top
ConnectDB()



const app = express();
app.use(cors());
app.use(express.json());

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  })
);
// user
app.use('/api',userRoutes)
// Routes
app.use('/api/menu', menurouter);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api', Info);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on Port : ${PORT}`));