import { NextFunction, Request, RequestHandler, Response } from 'express';
import { JwtTokenService } from '../security/JwtTokenService';
import { TokenBlocklist } from '../security/TokenBlocklist';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      token?: string;
    }
  }
}

export function requireAuth(
  tokenService: JwtTokenService,
  blocklist: TokenBlocklist,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or malformed Authorization header.' });
      return;
    }

    const token = header.slice('Bearer '.length);
    if (blocklist.isRevoked(token)) {
      res.status(401).json({ error: 'Token has been revoked.' });
      return;
    }

    const payload = tokenService.verify(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token.' });
      return;
    }

    req.userId = payload.userId;
    req.token = token;
    next();
  };
}
