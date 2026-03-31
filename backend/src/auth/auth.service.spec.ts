import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UtilisateurService } from '../utilisateur/utilisateur.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let utilisateurService: any;
  let jwtService: any;

  beforeEach(async () => {
    utilisateurService = { findByEmail: jest.fn(), sanitizeUser: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UtilisateurService, useValue: utilisateurService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should hash password correctly', async () => {
    await bcrypt.hash('pass', 10);
    expect(bcrypt.hash).toHaveBeenCalled();
  });

  it('should return token on valid login', async () => {
    utilisateurService.findByEmail.mockResolvedValue({ id: '1', motDePasseHash: 'hash' });
    const res = await service.login({ email: 'u@u.com', motDePasse: 'pwd' });
    expect(res.accessToken).toBe('token');
  });

  it('should throw on invalid password', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    utilisateurService.findByEmail.mockResolvedValue({ id: '1', motDePasseHash: 'hash' });
    await expect(service.login({ email: 'u@u.com', motDePasse: 'wrong' })).rejects.toThrow();
  });
});
