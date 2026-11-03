import type { RequestHandler } from 'express';

const logger: RequestHandler = (req, res, next) => {
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode}`);
  });

  next();
};

export default logger;
