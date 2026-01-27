import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createTestApp,
  cleanupDatabase,
  createRoomFixture,
  createParticipantFixture,
} from './test-utils';

describe('RoomsController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const context = await createTestApp();
    app = context.app;
    prisma = context.prisma;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);
  });

  describe('POST /api/rooms', () => {
    it('should create a room with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/rooms')
        .send({ name: 'Sprint Planning' })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'Sprint Planning',
        votingScale: 'fibonacci',
        isAnonymous: false,
        autoReveal: true,
      });
    });

    it('should create a room with all options', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/rooms')
        .send({
          name: 'Custom Room',
          password: 'secret123',
          votingScale: 'tshirt',
          customScale: ['XS', 'S', 'M', 'L', 'XL'],
          isAnonymous: true,
          autoReveal: false,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Custom Room',
        password: 'secret123',
        votingScale: 'tshirt',
        customScale: ['XS', 'S', 'M', 'L', 'XL'],
        isAnonymous: true,
        autoReveal: false,
      });
    });

    it('should reject room without name', async () => {
      await request(app.getHttpServer())
        .post('/api/rooms')
        .send({})
        .expect(400);
    });

    it('should reject room with empty name', async () => {
      await request(app.getHttpServer())
        .post('/api/rooms')
        .send({ name: '' })
        .expect(400);
    });
  });

  describe('GET /api/rooms/:id', () => {
    it('should return existing room with stories and participants', async () => {
      const room = await createRoomFixture(prisma, { name: 'My Room' });
      await createParticipantFixture(prisma, room.id, { name: 'Alice' });

      const response = await request(app.getHttpServer())
        .get(`/api/rooms/${room.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: room.id,
        name: 'My Room',
        stories: [],
        participants: expect.arrayContaining([
          expect.objectContaining({ name: 'Alice' }),
        ]),
      });
    });

    it('should return 404 for non-existent room', async () => {
      await request(app.getHttpServer())
        .get('/api/rooms/non-existent-uuid')
        .expect(404);
    });
  });

  describe('PATCH /api/rooms/:id', () => {
    it('should update room properties', async () => {
      const room = await createRoomFixture(prisma);

      const response = await request(app.getHttpServer())
        .patch(`/api/rooms/${room.id}`)
        .send({
          name: 'Updated Room',
          isAnonymous: true,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: room.id,
        name: 'Updated Room',
        isAnonymous: true,
      });
    });

    it('should return 404 for non-existent room', async () => {
      await request(app.getHttpServer())
        .patch('/api/rooms/non-existent-uuid')
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/rooms/:id', () => {
    it('should delete existing room', async () => {
      const room = await createRoomFixture(prisma);

      await request(app.getHttpServer())
        .delete(`/api/rooms/${room.id}`)
        .expect(204);

      // Verify room is deleted
      const deletedRoom = await prisma.room.findUnique({
        where: { id: room.id },
      });
      expect(deletedRoom).toBeNull();
    });

    it('should return 404 for non-existent room', async () => {
      await request(app.getHttpServer())
        .delete('/api/rooms/non-existent-uuid')
        .expect(404);
    });
  });

  describe('POST /api/rooms/:id/join', () => {
    it('should join public room', async () => {
      const room = await createRoomFixture(prisma);

      const response = await request(app.getHttpServer())
        .post(`/api/rooms/${room.id}/join`)
        .send({ name: 'Bob' })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        roomId: room.id,
        name: 'Bob',
        role: 'facilitator', // First participant is facilitator
        isOnline: true,
      });
    });

    it('should make second participant a voter', async () => {
      const room = await createRoomFixture(prisma);
      await createParticipantFixture(prisma, room.id, {
        name: 'First',
        role: 'facilitator',
      });

      const response = await request(app.getHttpServer())
        .post(`/api/rooms/${room.id}/join`)
        .send({ name: 'Second' })
        .expect(201);

      expect(response.body.role).toBe('voter');
    });

    it('should join password-protected room with correct password', async () => {
      const room = await createRoomFixture(prisma, { password: 'secret' });

      const response = await request(app.getHttpServer())
        .post(`/api/rooms/${room.id}/join`)
        .send({ name: 'Charlie', password: 'secret' })
        .expect(201);

      expect(response.body.name).toBe('Charlie');
    });

    it('should reject join with wrong password', async () => {
      const room = await createRoomFixture(prisma, { password: 'secret' });

      await request(app.getHttpServer())
        .post(`/api/rooms/${room.id}/join`)
        .send({ name: 'Eve', password: 'wrong' })
        .expect(403);
    });

    it('should return 404 for non-existent room', async () => {
      await request(app.getHttpServer())
        .post('/api/rooms/non-existent-uuid/join')
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('GET /api/rooms/:id/participants', () => {
    it('should return all participants', async () => {
      const room = await createRoomFixture(prisma);
      await createParticipantFixture(prisma, room.id, { name: 'Alice' });
      await createParticipantFixture(prisma, room.id, { name: 'Bob' });

      const response = await request(app.getHttpServer())
        .get(`/api/rooms/${room.id}/participants`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Alice' }),
          expect.objectContaining({ name: 'Bob' }),
        ]),
      );
    });
  });

  describe('GET /api/rooms/:id/export', () => {
    it('should export room data', async () => {
      const room = await createRoomFixture(prisma, { name: 'Export Test' });
      await createParticipantFixture(prisma, room.id, { name: 'Exporter' });

      const response = await request(app.getHttpServer())
        .get(`/api/rooms/${room.id}/export`)
        .expect(200);

      expect(response.body).toMatchObject({
        roomName: 'Export Test',
        votingScale: 'fibonacci',
        exportedAt: expect.any(String),
        stories: [],
        participants: expect.arrayContaining([
          expect.objectContaining({ name: 'Exporter' }),
        ]),
      });
    });
  });
});
