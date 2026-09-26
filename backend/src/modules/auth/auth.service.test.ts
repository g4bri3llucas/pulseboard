import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authService, AuthError } from './auth.service';
import { userRepository } from '../users/user.repository';

vi.mock('../users/user.repository', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
  },
}));

describe('authService.register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a user when the email is not in use', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.create).mockResolvedValue({
      id: '1',
      name: 'Lucas',
      email: 'lucas@test.com',
      passwordHash: 'hashed',
      createdAt: new Date(),
    });

    const result = await authService.register('Lucas', 'lucas@test.com', '123456');

    expect(result).toEqual({ id: '1', name: 'Lucas', email: 'lucas@test.com' });
    expect(userRepository.create).toHaveBeenCalledTimes(1);
  });

  it('throws AuthError when the email is already in use', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue({
      id: '1',
      name: 'Lucas',
      email: 'lucas@test.com',
      passwordHash: 'hashed',
      createdAt: new Date(),
    });

    await expect(
      authService.register('Lucas', 'lucas@test.com', '123456'),
    ).rejects.toThrow(AuthError);

    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('hashes the password before saving', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.create).mockImplementation((data) =>
      Promise.resolve({ id: '1', createdAt: new Date(), ...data }),
    );

    await authService.register('Lucas', 'lucas@test.com', '123456');

    const createdData = vi.mocked(userRepository.create).mock.calls[0][0];
    expect(createdData.passwordHash).not.toBe('123456');

    const matches = await bcrypt.compare('123456', createdData.passwordHash);
    expect(matches).toBe(true);
  });
});

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('returns a valid token when credentials are correct', async () => {
    const passwordHash = await bcrypt.hash('123456', 10);
    vi.mocked(userRepository.findByEmail).mockResolvedValue({
      id: '1',
      name: 'Lucas',
      email: 'lucas@test.com',
      passwordHash,
      createdAt: new Date(),
    });

    const result = await authService.login('lucas@test.com', '123456');

    expect(result.user).toEqual({ id: '1', name: 'Lucas', email: 'lucas@test.com' });

    const payload = jwt.verify(result.token, 'test-secret') as { userId: string };
    expect(payload.userId).toBe('1');
  });

  it('throws AuthError when the user does not exist', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(authService.login('nobody@test.com', '123456')).rejects.toThrow(
      AuthError,
    );
  });

  it('throws AuthError when the password is wrong', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    vi.mocked(userRepository.findByEmail).mockResolvedValue({
      id: '1',
      name: 'Lucas',
      email: 'lucas@test.com',
      passwordHash,
      createdAt: new Date(),
    });

    await expect(
      authService.login('lucas@test.com', 'wrong-password'),
    ).rejects.toThrow(AuthError);
  });
});