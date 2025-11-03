import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });

    const secret = process.env.JWT_SECRET || 'changeme';
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '7d' });

    return res.json({ token, user: { id: user._id, email: user.email, subscriptionStatus: user.subscriptionStatus } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const secret = process.env.JWT_SECRET || 'changeme';
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '7d' });

    return res.json({ token, user: { id: user._id, email: user.email, subscriptionStatus: user.subscriptionStatus } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
