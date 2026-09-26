import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../users/user.repository';

const SALT_ROUNDS = 10;

export class AuthError extends Error {}

export const authService = {
  async register(name: string, email: string, password: string) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AuthError('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.create({ name, email, passwordHash });

    return { id: user.id, name: user.name, email: user.email };
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AuthError('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new AuthError('Invalid credentials');
    }

    const JWT_SECRET = process.env.JWT_SECRET as string;
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return { token, user: { id: user.id, name: user.name, email: user.email } };
  },
};