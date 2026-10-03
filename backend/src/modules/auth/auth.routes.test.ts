import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/prisma';

describe('Auth routes', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    it('creates a new user and returns 201', async () => {
      const response = await request(app).post('/auth/register').send({
        name: 'Lucas',
        email: 'lucas@test.com',
        password: '123456',
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(String),
        name: 'Lucas',
        email: 'lucas@test.com',
      });
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('returns 400 for invalid input', async () => {
      const response = await request(app).post('/auth/register').send({
        name: 'L',
        email: 'not-an-email',
        password: '123',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('returns 401 when the email is already registered', async () => {
      await request(app).post('/auth/register').send({
        name: 'Lucas',
        email: 'lucas@test.com',
        password: '123456',
      });

      const response = await request(app).post('/auth/register').send({
        name: 'Another Lucas',
        email: 'lucas@test.com',
        password: '654321',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/auth/register').send({
        name: 'Lucas',
        email: 'lucas@test.com',
        password: '123456',
      });
    });

    it('returns a token for correct credentials', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'lucas@test.com',
        password: '123456',
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toEqual(expect.any(String));
      expect(response.body.user.email).toBe('lucas@test.com');
    });

    it('returns 401 for wrong password', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'lucas@test.com',
        password: 'wrong-password',
      });

      expect(response.status).toBe(401);
    });
  });
});