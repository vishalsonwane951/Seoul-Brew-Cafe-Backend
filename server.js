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
import { initSocket } from "./socket.js";
import http from "http";
import bcrypt from 'bcryptjs';
import userModel from './models/userModel.js';
import { Server } from "socket.io";
import menuRoutes from './routes/admin/menuRoutes.js'
import reservationRoutes from './routes/admin/reservationRoutes.js'


// import bcrypt from 'bcryptjs';
// import User from './models/userModel.js'

dotenv.config(); // Must be at the very top
ConnectDB()



const app = express();
app.use(cors());
app.use(express.json());


// Migration

// mongoose.connect(process.env.MONGO_URL).then(async () => {
//   const users = await User.find({ role: { $exists: true } });
//   for (let user of users) {
//     user.admin = user.role === "admin";
//     user.role = undefined; // remove old field
//     await user.save();
//   }
//   console.log("Migration complete!");
//   mongoose.disconnect();
// });

// app.use(
//   cors({
//     origin: [
//       process.env.FRONTEND_URL,
//     ],
//     credentials: true,
//   })
// );

// app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
// const password = "Admin@123";
// const hashedPassword = await bcrypt.hash(password, 10);

// await userModel.create({
//   name: "Admin",
//   email: "admin@gmail.com",
//   password: hashedPassword,
//   admin: true, // <-- now boolean
// });

// Admin
app.use("/api/menu", menuRoutes);
app.use('/api',reservationRoutes)




// user
app.use('/api',userRoutes)
// Routes
app.use('/api/menu', menurouter);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api', Info);

/* Create HTTP server */
const server = http.createServer(app);
  
/* Attach socket.io to server */
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // frontend URL
    methods: ["GET", "POST", "PATCH"],
  },
});
app.use((req, res, next) => {
  req.io = io;
  next();
});

/* Socket connection */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on Port : ${PORT}`));