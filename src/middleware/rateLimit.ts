import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again later.' }
});

export const emergencyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Emergency override rate limit exceeded.' }
});

export const controlLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Infrastructure control rate limit exceeded.' }
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'API rate limit exceeded.' }
});
