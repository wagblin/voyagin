// Reproduit le bug observé sur un vrai appareil (iPhone, Expo Go) : un crash immédiat au lancement
// de l'app, avant toute action utilisateur, causé par le code interne d'exifr qui lit
// `navigator.userAgent` dès le chargement du module. Sous Hermes/React Native, `navigator` existe
// mais `navigator.userAgent` est `undefined` (contrairement à l'environnement Jest par défaut, où
// Node fournit un `navigator.userAgent` du type `Node.js/24`, ce qui rend ce bug invisible dans
// tous les tests qui mockent déjà `exifr`).
//
// Ce fichier NE mocke PAS `exifr` : il laisse le vrai module se charger, pour vérifier que son code
// ne plante pas dans un environnement qui simule fidèlement l'écart réel constaté sur appareil.
// `navigator.userAgent` est forcé à `undefined` AVANT que `../exifFileLocation` soit chargé (via un
// `require()` différé plutôt qu'un `import` statique en tête de fichier) : le crash réel a lieu au
// chargement du module, pas au moment de l'appel de la fonction — un `import` statique ici
// chargerait exifr trop tôt (avant le `beforeEach`), à un moment où `navigator.userAgent` a encore
// sa valeur par défaut fournie par Jest, et ne reproduirait donc pas le bug.
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('ZmFrZS1ieXRlcw=='),
  EncodingType: { Base64: 'base64' },
}));

describe('extractGpsFromFileUri on a real device environment (navigator.userAgent undefined)', () => {
  // Node 24 (dev local) fournit un `navigator` global natif ; Node 20 (CI) n'en fournit aucun — on
  // capture donc le descripteur de la propriété `navigator` sur `globalThis` elle-même (pas celui de
  // `userAgent` sur un `navigator` supposé préexistant), pour pouvoir restaurer l'état exact d'avant
  // le test dans les deux cas.
  const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

  beforeEach(() => {
    jest.resetModules();
    if (!('navigator' in globalThis)) {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        configurable: true,
        writable: true,
      });
    }
    Object.defineProperty(globalThis.navigator, 'userAgent', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    if (originalNavigatorDescriptor) {
      Object.defineProperty(globalThis, 'navigator', originalNavigatorDescriptor);
    } else {
      delete (globalThis as { navigator?: unknown }).navigator;
    }
  });

  it('loads the module and resolves without crashing when navigator.userAgent is undefined', async () => {
    await expect(
      (async () => {
        // Chargement volontairement différé au sein du test, voir le commentaire en tête de fichier.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const exifFileLocation = require('../exifFileLocation') as typeof import('../exifFileLocation');
        return exifFileLocation.extractGpsFromFileUri('file:///fake.jpg');
      })(),
    ).resolves.not.toThrow();
  });
});
