import swaggerJSDoc from 'swagger-jsdoc';
import path from 'node:path';

const swaggerDefinition: swaggerJSDoc.SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'VoyagIn API',
    version: '0.1.0',
    description: 'API du carnet de voyage collaboratif VoyagIn.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [path.join(__dirname, '../adapters/http/*.ts'), path.join(__dirname, '../adapters/http/*.js')],
});
