import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

const ERROR_LOG = path.resolve(process.cwd(), 'backend_error.log');

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  try {
    const msg = err instanceof Error ? `${err.stack ?? err.message}` : JSON.stringify(err);
    console.error(msg);
    fs.appendFileSync(ERROR_LOG, `[${new Date().toISOString()}] ${msg}\n\n`);
  } catch (e) {
    // ignore logging failures
  }
  if (res.headersSent) {
    return;
  }
  const devMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
  res.status(500).json({ error: process.env.NODE_ENV !== 'production' ? devMsg : 'An unexpected error occurred.' });
}
