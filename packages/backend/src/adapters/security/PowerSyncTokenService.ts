import jwt from 'jsonwebtoken';

export class PowerSyncTokenService {
  constructor(
    private readonly secret: string,
    private readonly audience: string,
    private readonly kid: string = 'voyagin-backend',
    private readonly expiresIn: string = '60m',
  ) {}

  issue(userId: string): string {
    return jwt.sign({ sub: userId, aud: this.audience }, this.secret, {
      expiresIn: this.expiresIn as NonNullable<jwt.SignOptions['expiresIn']>,
      header: { alg: 'HS256', kid: this.kid },
    });
  }
}
