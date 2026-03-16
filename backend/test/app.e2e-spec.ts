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

});
