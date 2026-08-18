import { z } from 'zod';
import { DeleteUserUseCase, UpdateUserUseCase, UserRepository } from '@voyagin/domain';
import { TokenBlocklist } from '../security/TokenBlocklist';
import { asyncHandler } from './asyncHandler';
import { serializeUser } from './serializers';

const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
});

export interface UserControllerDependencies {
  userRepository: UserRepository;
  tokenBlocklist: TokenBlocklist;
}

export function buildUserController(deps: UserControllerDependencies) {
  const updateMe = asyncHandler(async (req, res) => {
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const useCase = new UpdateUserUseCase(deps.userRepository);
    const user = await useCase.execute({
      userId: req.userId as string,
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
    });

    res.status(200).json(serializeUser(user));
  });

  const deleteMe = asyncHandler(async (req, res) => {
    const useCase = new DeleteUserUseCase(deps.userRepository);
    await useCase.execute({ userId: req.userId as string });

    if (req.token) {
      deps.tokenBlocklist.revoke(req.token);
    }

    res.status(204).send();
  });

  return { updateMe, deleteMe };
}
