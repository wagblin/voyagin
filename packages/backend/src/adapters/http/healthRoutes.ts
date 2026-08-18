import { Router } from 'express';

export function buildHealthRoutes(): Router {
  const router = Router();

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Vérifie que l'API est en ligne.
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: L'API répond.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   */
  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  return router;
}
