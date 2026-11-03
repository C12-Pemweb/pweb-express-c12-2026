import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../utils/http-error.js';

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ status: false, message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ status: false, message: 'Terjadi kesalahan pada server' });
};

export default errorHandler;
