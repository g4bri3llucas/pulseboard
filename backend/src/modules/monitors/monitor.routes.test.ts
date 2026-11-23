import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/prisma';

async function tokenFor(email: string): Promise<string> {
  await request(app).post('/auth/register').send({ name: 'Lucas', email, password: '123456' });
  const response = await request(app).post('/auth/login').send({ email, password: '123456' });
  return response.body.token;
}

async function createMonitor(token: string): Promise<string> {
  const response = await request(app)
    .post('/monitors')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Minha API', url: 'https://api.example.com/health' });
  return response.body.id;
}

describe('DELETE /monitors/:id', () => {
  beforeEach(async () => {
    await prisma.monitor.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.monitor.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('removes a monitor together with its checks and incidents', async () => {
    const token = await tokenFor('lucas@test.com');
    const monitorId = await createMonitor(token);
    await prisma.check.create({ data: { monitorId, status: 'DOWN', responseTime: 120 } });
    await prisma.incident.create({ data: { monitorId } });

    const response = await request(app)
      .delete(`/monitors/${monitorId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect(await prisma.monitor.count({ where: { id: monitorId } })).toBe(0);
    expect(await prisma.check.count({ where: { monitorId } })).toBe(0);
    expect(await prisma.incident.count({ where: { monitorId } })).toBe(0);
  });

  it('returns 403 when the monitor belongs to another user', async () => {
    const ownerToken = await tokenFor('dono@test.com');
    const otherToken = await tokenFor('outro@test.com');
    const monitorId = await createMonitor(ownerToken);

    const response = await request(app)
      .delete(`/monitors/${monitorId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(response.status).toBe(403);
    expect(await prisma.monitor.count({ where: { id: monitorId } })).toBe(1);
  });
});
