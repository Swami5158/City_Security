import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'urbanshield-secret-key-12345';

export const generateToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
