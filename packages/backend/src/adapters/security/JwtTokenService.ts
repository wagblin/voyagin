import jwt from 'jsonwebtoken';

export interface AuthToken {
  userId: string;
}

export class JwtTokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = '7d',
  ) {}

  issue(userId: string): string {
    return jwt.sign({ sub: userId }, this.secret, {
      expiresIn: this.expiresIn as NonNullable<jwt.SignOptions['expiresIn']>,
    });
  }

  verify(token: string): AuthToken | null {
    try {
      const payload = jwt.verify(token, this.secret);
      if (typeof payload === 'object' && payload !== null && typeof payload.sub === 'string') {
        return { userId: payload.sub };
      }
      return null;
    } catch {
      return null;
    }
  }
}
