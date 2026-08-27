import { Router } from 'express';
import { AuthControllerDependencies, buildAuthController } from './authController';
import { requireAuth } from './requireAuth';

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         email: { type: string }
 *         name: { type: string }
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token: { type: string }
 *         user: { $ref: '#/components/schemas/User' }
 */
export function buildAuthRoutes(deps: AuthControllerDependencies): Router {
  const router = Router();
  const controller = buildAuthController(deps);

  /**
   * @openapi
   * /auth/register:
   *   post:
   *     summary: Crée un compte utilisateur.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, name, password]
   *             properties:
   *               email: { type: string }
   *               name: { type: string }
   *               password: { type: string, minLength: 8 }
   *     responses:
   *       201:
   *         description: Compte créé.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/AuthResponse' }
   *       400: { description: Requête invalide ou mot de passe trop faible. }
   *       409: { description: Email déjà utilisé. }
   */
  router.post('/auth/register', controller.register);

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     summary: Connecte un utilisateur existant.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string }
   *               password: { type: string }
   *     responses:
   *       200:
   *         description: Authentification réussie.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/AuthResponse' }
   *       401: { description: Email ou mot de passe invalide. }
   */
  router.post('/auth/login', controller.login);

  /**
   * @openapi
   * /auth/logout:
   *   post:
   *     summary: Déconnecte l'utilisateur (révoque le token courant).
   *     tags: [Auth]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       204: { description: Déconnecté. }
   *       401: { description: Non authentifié. }
   */
  router.post(
    '/auth/logout',
    requireAuth(deps.tokenService, deps.tokenBlocklist),
    controller.logout,
  );

  /**
   * @openapi
   * /auth/powersync-token:
   *   post:
   *     summary: Échange le token de session contre un token PowerSync dédié, à courte durée de vie.
   *     description: >
   *       PowerSync Cloud exige un JWT avec une revendication "aud" (l'URL de l'instance PowerSync) et
   *       un écart maximum de 24h entre "iat" et "exp". Le token de session normal (7 jours) ne convient
   *       donc pas tel quel : cet endpoint en émet un second, dédié, avec une durée de vie courte.
   *     tags: [Auth]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Token PowerSync émis.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token: { type: string }
   *       401: { description: Non authentifié. }
   */
  router.post(
    '/auth/powersync-token',
    requireAuth(deps.tokenService, deps.tokenBlocklist),
    controller.issuePowerSyncToken,
  );

  return router;
}
