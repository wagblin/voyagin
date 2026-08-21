import { Router } from 'express';
import multer from 'multer';
import { JwtTokenService } from '../security/JwtTokenService';
import { TokenBlocklist } from '../security/TokenBlocklist';
import { PhotoControllerDependencies, buildPhotoController } from './photoController';
import { requireAuth } from './requireAuth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export function buildPhotoRoutes(
  deps: PhotoControllerDependencies & { tokenService: JwtTokenService; tokenBlocklist: TokenBlocklist },
): Router {
  const router = Router();
  const controller = buildPhotoController(deps);
  const auth = requireAuth(deps.tokenService, deps.tokenBlocklist);

  /**
   * @openapi
   * components:
   *   schemas:
   *     Photo:
   *       type: object
   *       properties:
   *         id: { type: string }
   *         tripId: { type: string }
   *         uploaderId: { type: string }
   *         imageUrl: { type: string }
   *         location:
   *           type: object
   *           nullable: true
   *           properties:
   *             latitude: { type: number }
   *             longitude: { type: number }
   *         takenAt: { type: string, format: date-time }
   *         caption: { type: string, nullable: true }
   */

  /**
   * @openapi
   * /trips/{id}/photos:
   *   post:
   *     summary: Ajoute une photo géolocalisée au voyage — réservé aux participants.
   *     tags: [Photos]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [image]
   *             properties:
   *               image: { type: string, format: binary }
   *               latitude: { type: number }
   *               longitude: { type: number }
   *               takenAt: { type: string, format: date-time }
   *               caption: { type: string }
   *     responses:
   *       201:
   *         description: Photo ajoutée.
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Photo' }
   *       400: { description: Image manquante ou coordonnées invalides. }
   *       403: { description: L'utilisateur n'est pas participant du voyage. }
   *       404: { description: Voyage introuvable. }
   *   get:
   *     summary: Liste les photos du voyage — réservé aux participants.
   *     tags: [Photos]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Liste des photos, triées par date de prise de vue.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items: { $ref: '#/components/schemas/Photo' }
   *       403: { description: L'utilisateur n'est pas participant du voyage. }
   */
  router.post('/trips/:id/photos', auth, upload.single('image'), controller.addPhoto);
  router.get('/trips/:id/photos', auth, controller.listTripPhotos);

  /**
   * @openapi
   * /photos/{id}:
   *   delete:
   *     summary: Supprime une photo — réservé à l'auteur ou au owner du voyage.
   *     tags: [Photos]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       204: { description: Photo supprimée. }
   *       403: { description: Ni l'auteur de la photo, ni le owner du voyage. }
   *       404: { description: Photo introuvable. }
   */
  router.delete('/photos/:id', auth, controller.deletePhoto);

  return router;
}
