import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// augment Request type so we can attach user
declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = auth.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'JWT_SECRET not configured' });

    const payload: any = jwt.verify(token, secret);
    if (!payload || !payload.userId) return res.status(401).json({ error: 'Invalid token' });

    const user = await User.findById(payload.userId).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    return next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Unauthorized', message: err.message });
  }
};

export default authMiddleware;
