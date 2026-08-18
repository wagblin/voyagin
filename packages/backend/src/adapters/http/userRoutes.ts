import { Router } from 'express';
import { JwtTokenService } from '../security/JwtTokenService';
import { UserControllerDependencies, buildUserController } from './userController';
import { requireAuth } from './requireAuth';

export function buildUserRoutes(
  deps: UserControllerDependencies & { tokenService: JwtTokenService },
): Router {
  const router = Router();
  const controller = buildUserController(deps);
  const auth = requireAuth(deps.tokenService, deps.tokenBlocklist);

  /**
   * @openapi
   * /users/me:
   *   patch:
   *     summary: Modifie le profil de l'utilisateur authentifié.
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               email: { type: string }
   *     responses:
   *       200:
   *         description: Profil mis à jour.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/User' }
   *       401: { description: Non authentifié. }
   *   delete:
   *     summary: Supprime le compte de l'utilisateur authentifié.
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       204: { description: Compte supprimé. }
   *       401: { description: Non authentifié. }
   */
  router.patch('/users/me', auth, controller.updateMe);
  router.delete('/users/me', auth, controller.deleteMe);

  return router;
}
