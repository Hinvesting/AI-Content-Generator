import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// connect to MongoDB
const mongoUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/ai-content-generator';
mongoose.connect(mongoUrl).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error', err);
});

// import routes
import authRoutes from './routes/auth.routes';
import generationRoutes from './routes/generation.routes';
import stripeRoutes from './routes/stripe.routes';

app.use('/api/auth', authRoutes);
app.use('/api/generate', generationRoutes);
app.use('/api/stripe', stripeRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});

export default app;
