import type { Response } from 'express';
import type { PaginationMeta } from './pagination.js';

interface SuccessOptions {
  message: string;
  data: unknown;
  metadata?: PaginationMeta;
  statusCode?: number;
}

export function sendSuccess(res: Response, { message, data, metadata, statusCode = 200 }: SuccessOptions) {
  return res.status(statusCode).json({
    status: true,
    message,
    data,
    ...(metadata !== undefined && { metadata }),
  });
}
