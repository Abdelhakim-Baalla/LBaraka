import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const uniqueSuffix = Date.now();
  const basePayload = {
    email: `citoyen.${uniqueSuffix}@lbaraka.test`,
    motDePasse: 'Password123',
    telephone: '0612345678',
    cin: `AB${uniqueSuffix.toString().slice(-6)}`,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    prisma = moduleFixture.get(PrismaService);
    await app.init();

    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: basePayload.email },
          { telephone: basePayload.telephone },
        ],
      },
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: basePayload.email },
          { telephone: basePayload.telephone },
        ],
      },
    });

    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/auth/register (POST) inscrit un citoyen avec score initial 0', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(basePayload)
      .expect(201);

    expect(response.body.message).toContain('Inscription réussie');
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.utilisateur.email).toBe(basePayload.email);
    expect(response.body.utilisateur.telephone).toBe(basePayload.telephone);
    expect(response.body.utilisateur.profil.cin).toBe(basePayload.cin);
    expect(response.body.utilisateur.profil.lBarakaScore).toBe(0);
    expect(response.body.utilisateur.motDePasseHash).toBeUndefined();
  });

  it('/auth/register (POST) refuse un CIN déjà utilisé', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(basePayload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...basePayload,
        email: `autre.${uniqueSuffix}@lbaraka.test`,
        telephone: '0712345678',
      })
      .expect(409);
  });

  it('/auth/login (POST) connecte un utilisateur avec des identifiants valides', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(basePayload)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: basePayload.email, motDePasse: basePayload.motDePasse })
      .expect(201);

    expect(response.body.message).toBe('Connexion réussie');
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.utilisateur.email).toBe(basePayload.email);
    expect(response.body.utilisateur.motDePasseHash).toBeUndefined();
  });

  it('/auth/login (POST) refuse un mot de passe invalide', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(basePayload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: basePayload.email, motDePasse: 'WrongPassword123' })
      .expect(401);
  });

  it('/wallet/me (GET) retourne un wallet initialise a 0', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(basePayload)
      .expect(201);

    const token = registerResponse.body.accessToken;

    const response = await request(app.getHttpServer())
      .get('/wallet/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.wallet).toBeDefined();
    expect(response.body.wallet.soldeReel).toBe(0);
    expect(response.body.wallet.soldeBloque).toBe(0);
    expect(response.body.wallet.devise).toBe('MAD');
  });

  it('/wallet (POST) applique depot + blocage + deblocage', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(basePayload)
      .expect(201);

    const token = registerResponse.body.accessToken;

    const depot = await request(app.getHttpServer())
      .post('/wallet/depot')
      .set('Authorization', `Bearer ${token}`)
      .send({ montant: 100 })
      .expect(201);

    expect(depot.body.wallet.soldeReel).toBe(100);
    expect(depot.body.wallet.soldeBloque).toBe(0);

    const blocage = await request(app.getHttpServer())
      .post('/wallet/blocage')
      .set('Authorization', `Bearer ${token}`)
      .send({ montant: 30 })
      .expect(201);

    expect(blocage.body.wallet.soldeReel).toBe(70);
    expect(blocage.body.wallet.soldeBloque).toBe(30);

    const deblocage = await request(app.getHttpServer())
      .post('/wallet/deblocage')
      .set('Authorization', `Bearer ${token}`)
      .send({ montant: 10 })
      .expect(201);

    expect(deblocage.body.wallet.soldeReel).toBe(80);
    expect(deblocage.body.wallet.soldeBloque).toBe(20);
  });

  it('/annonces (POST) publie une annonce avec exactement 3 photos', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(basePayload)
      .expect(201);

    const token = registerResponse.body.accessToken;

    const response = await request(app.getHttpServer())
      .post('/annonces')
      .set('Authorization', `Bearer ${token}`)
      .field('titre', 'Perceuse Bosch')
      .field('description', 'Perceuse en bon etat, disponible ce weekend.')
      .field('categorie', 'BRICOLAGE')
      .field('mode', 'DON_GRATUIT')
      .field('condition', 'BON_ETAT')
      .field('geolocalisation', '[31.6295,-8.0081]')
      .attach('photos', __filename)
      .attach('photos', __filename)
      .attach('photos', __filename)
      .expect(201);

    expect(response.body.annonce).toBeDefined();
    expect(response.body.annonce.photos).toHaveLength(3);
    expect(response.body.annonce.titre).toBe('Perceuse Bosch');
  });

  it('/annonces (POST) refuse une annonce avec moins de 3 photos', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(basePayload)
      .expect(201);

    const token = registerResponse.body.accessToken;

    await request(app.getHttpServer())
      .post('/annonces')
      .set('Authorization', `Bearer ${token}`)
      .field('titre', 'Lit bebe')
      .field('description', 'Lit bebe presque neuf.')
      .field('categorie', 'AUTRE')
      .field('mode', 'PRET_TEMPORAIRE')
      .field('condition', 'NEUF')
      .field('geolocalisation', '[31.6295,-8.0081]')
      .attach('photos', __filename)
      .attach('photos', __filename)
      .expect(400);
  });

  it('/annonces (POST) refuse la position par defaut', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(basePayload)
      .expect(201);

    const token = registerResponse.body.accessToken;

    await request(app.getHttpServer())
      .post('/annonces')
      .set('Authorization', `Bearer ${token}`)
      .field('titre', 'Chaise bebe')
      .field('description', 'Chaise bebe propre.')
      .field('categorie', 'AUTRE')
      .field('mode', 'DON_GRATUIT')
      .field('condition', 'BON_ETAT')
      .field('geolocalisation', '[33.5731,-7.5898]')
      .attach('photos', __filename)
      .attach('photos', __filename)
      .attach('photos', __filename)
      .expect(400);
  });

  it('/annonces (POST) refuse des coordonnees hors bornes', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(basePayload)
      .expect(201);

    const token = registerResponse.body.accessToken;

    await request(app.getHttpServer())
      .post('/annonces')
      .set('Authorization', `Bearer ${token}`)
      .field('titre', 'Table pliante')
      .field('description', 'Table en bon etat.')
      .field('categorie', 'BRICOLAGE')
      .field('mode', 'PRET_TEMPORAIRE')
      .field('condition', 'BON_ETAT')
      .field('geolocalisation', '[123,-8.0081]')
      .attach('photos', __filename)
      .attach('photos', __filename)
      .attach('photos', __filename)
      .expect(400);
  });

});
