import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/prisma';

const MINUTE_MS = 60 * 1000;

async function tokenFor(email: string): Promise<string> {
  await request(app).post('/auth/register').send({ name: 'Lucas', email, password: '123456' });
  const response = await request(app).post('/auth/login').send({ email, password: '123456' });
  return response.body.token;
}

async function createMonitor(token: string, name = 'Minha API'): Promise<string> {
  const response = await request(app)
    .post('/monitors')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, url: 'https://api.example.com/health' });
  return response.body.id;
}

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * MINUTE_MS);
}

beforeEach(async () => {
  await prisma.monitor.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.monitor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('GET /monitors', () => {
  it('returns the current status, last check and 24h uptime of each monitor', async () => {
    const token = await tokenFor('lucas@test.com');
    const monitorId = await createMonitor(token);
    const latestCheckAt = minutesAgo(1);
    await prisma.check.createMany({
      data: [
        { monitorId, status: 'UP', responseTime: 300, checkedAt: minutesAgo(25 * 60) },
        { monitorId, status: 'DOWN', responseTime: null, checkedAt: minutesAgo(3) },
        { monitorId, status: 'UP', responseTime: 150, checkedAt: minutesAgo(2) },
        { monitorId, status: 'UP', responseTime: 182, checkedAt: latestCheckAt },
      ],
    });

    const response = await request(app).get('/monitors').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: monitorId,
      status: 'UP',
      lastCheck: { status: 'UP', responseTime: 182 },
      uptime24h: 66.67,
    });
    expect(response.body[0].lastCheck.checkedAt).toBe(latestCheckAt.toISOString());
  });

  it('reports UNKNOWN when the monitor has no recent check', async () => {
    const token = await tokenFor('lucas@test.com');
    const neverChecked = await createMonitor(token, 'Nunca checado');
    const stale = await createMonitor(token, 'Parado');
    await prisma.check.create({
      data: { monitorId: stale, status: 'UP', responseTime: 90, checkedAt: minutesAgo(10) },
    });

    const response = await request(app).get('/monitors').set('Authorization', `Bearer ${token}`);
    const byId = new Map(response.body.map((monitor: { id: string }) => [monitor.id, monitor]));

    expect(byId.get(neverChecked)).toMatchObject({
      status: 'UNKNOWN',
      lastCheck: null,
      uptime24h: null,
    });
    expect(byId.get(stale)).toMatchObject({
      status: 'UNKNOWN',
      lastCheck: { status: 'UP', responseTime: 90 },
      uptime24h: 100,
    });
  });
});

describe('DELETE /monitors/:id', () => {
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
