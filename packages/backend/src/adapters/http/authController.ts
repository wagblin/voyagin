import { Request, Response } from 'express';
import { z } from 'zod';
import {
  AuthenticateUserUseCase,
  PasswordHasher,
  RegisterUserUseCase,
  UserRepository,
} from '@voyagin/domain';
import { JwtTokenService } from '../security/JwtTokenService';
import { PowerSyncTokenService } from '../security/PowerSyncTokenService';
import { TokenBlocklist } from '../security/TokenBlocklist';
import { asyncHandler } from './asyncHandler';
import { serializeUser } from './serializers';

const registerSchema = z.object({
  email: z.string().min(1),
  name: z.string().min(1),
  password: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export interface AuthControllerDependencies {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  tokenService: JwtTokenService;
  tokenBlocklist: TokenBlocklist;
  powerSyncTokenService: PowerSyncTokenService;
}

export function buildAuthController(deps: AuthControllerDependencies) {
  const register = asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const useCase = new RegisterUserUseCase(deps.userRepository, deps.passwordHasher);
    const user = await useCase.execute({
      email: parsed.data.email,
      name: parsed.data.name,
      plainPassword: parsed.data.password,
    });

    const token = deps.tokenService.issue(user.id.toString());
    res.status(201).json({ token, user: serializeUser(user) });
  });

  const login = asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const useCase = new AuthenticateUserUseCase(deps.userRepository, deps.passwordHasher);
    const user = await useCase.execute({
      email: parsed.data.email,
      plainPassword: parsed.data.password,
    });

    const token = deps.tokenService.issue(user.id.toString());
    res.status(200).json({ token, user: serializeUser(user) });
  });

  const logout = (req: Request, res: Response): void => {
    if (req.token) {
      deps.tokenBlocklist.revoke(req.token);
    }
    res.status(204).send();
  };

  const issuePowerSyncToken = (req: Request, res: Response): void => {
    const token = deps.powerSyncTokenService.issue(req.userId as string);
    res.status(200).json({ token });
  };

  return { register, login, logout, issuePowerSyncToken };
}
