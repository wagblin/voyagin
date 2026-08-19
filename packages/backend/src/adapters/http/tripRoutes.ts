import { Router } from 'express';
import { JwtTokenService } from '../security/JwtTokenService';
import { TokenBlocklist } from '../security/TokenBlocklist';
import { TripControllerDependencies, buildTripController } from './tripController';
import { requireAuth } from './requireAuth';

export function buildTripRoutes(
  deps: TripControllerDependencies & { tokenService: JwtTokenService; tokenBlocklist: TokenBlocklist },
): Router {
  const router = Router();
  const controller = buildTripController(deps);
  const auth = requireAuth(deps.tokenService, deps.tokenBlocklist);

  /**
   * @openapi
   * components:
   *   schemas:
   *     Trip:
   *       type: object
   *       properties:
   *         id: { type: string }
   *         name: { type: string }
   *         dateRange:
   *           nullable: true
   *           type: object
   *           properties:
   *             start: { type: string, format: date-time }
   *             end: { type: string, format: date-time }
   *         participants:
   *           type: array
   *           items:
   *             type: object
   *             properties:
   *               userId: { type: string }
   *               name: { type: string }
   *               role: { type: string, enum: [owner, member] }
   */

  /**
   * @openapi
   * /trips:
   *   post:
   *     summary: Crée un voyage pour l'utilisateur authentifié.
   *     tags: [Trips]
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name]
   *             properties:
   *               name: { type: string }
   *     responses:
   *       201:
   *         description: Voyage créé.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Trip' }
   *       401: { description: Non authentifié. }
   *   get:
   *     summary: Liste les voyages de l'utilisateur authentifié.
   *     tags: [Trips]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des voyages.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items: { $ref: '#/components/schemas/Trip' }
   */
  router.post('/trips', auth, controller.createTrip);
  router.get('/trips', auth, controller.listMyTrips);

  /**
   * @openapi
   * /trips/{id}:
   *   get:
   *     summary: Récupère un voyage auquel l'utilisateur authentifié participe.
   *     tags: [Trips]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Voyage trouvé.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Trip' }
   *       404: { description: Voyage introuvable ou non accessible. }
   *   patch:
   *     summary: Modifie un voyage (nom et/ou dates) — owner uniquement.
   *     tags: [Trips]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               startDate: { type: string, format: date-time }
   *               endDate: { type: string, format: date-time }
   *     responses:
   *       200:
   *         description: Voyage mis à jour.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Trip' }
   *       403: { description: Seul le owner peut modifier ce voyage. }
   *       404: { description: Voyage introuvable. }
   *   delete:
   *     summary: Supprime un voyage — owner uniquement.
   *     tags: [Trips]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       204: { description: Voyage supprimé. }
   *       403: { description: Seul le owner peut supprimer ce voyage. }
   *       404: { description: Voyage introuvable. }
   */
  router.get('/trips/:id', auth, controller.getTrip);
  router.patch('/trips/:id', auth, controller.updateTrip);
  router.delete('/trips/:id', auth, controller.deleteTrip);

  /**
   * @openapi
   * /trips/{id}/participants:
   *   post:
   *     summary: Ajoute un utilisateur déjà inscrit comme participant du voyage — owner uniquement.
   *     tags: [Trips]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email: { type: string, format: email }
   *     responses:
   *       201:
   *         description: Participant ajouté, voyage mis à jour.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Trip' }
   *       400: { description: L'utilisateur est déjà participant. }
   *       403: { description: Seul le owner peut ajouter un participant. }
   *       404: { description: Voyage introuvable, ou aucun compte pour cet email. }
   */
  router.post('/trips/:id/participants', auth, controller.addParticipant);

  /**
   * @openapi
   * /trips/{id}/participants/{userId}:
   *   delete:
   *     summary: Retire un participant du voyage — owner uniquement, le owner ne peut pas se retirer lui-même.
   *     tags: [Trips]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *       - in: path
   *         name: userId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Participant retiré, voyage mis à jour.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Trip' }
   *       403: { description: Seul le owner peut retirer un participant. }
   *       404: { description: Voyage ou participant introuvable. }
   *       409: { description: Impossible de retirer le owner du voyage. }
   */
  router.delete('/trips/:id/participants/:userId', auth, controller.removeParticipant);

  return router;
}
