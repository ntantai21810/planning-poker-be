import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createTestApp,
  cleanupDatabase,
  createRoomFixture,
  createStoryFixture,
} from './test-utils';

describe('StoriesController (e2e)', () => {
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

  describe('POST /api/rooms/:roomId/stories', () => {
    it('should create a story in room', async () => {
      const room = await createRoomFixture(prisma);

      const response = await request(app.getHttpServer())
        .post(`/api/rooms/${room.id}/stories`)
        .send({ title: 'User Login Feature' })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        roomId: room.id,
        title: 'User Login Feature',
        status: 'pending',
        order: 0,
      });
    });

    it('should create story with description', async () => {
      const room = await createRoomFixture(prisma);

      const response = await request(app.getHttpServer())
        .post(`/api/rooms/${room.id}/stories`)
        .send({
          title: 'Payment Integration',
          description: 'Integrate Stripe payment gateway',
        })
        .expect(201);

      expect(response.body.description).toBe('Integrate Stripe payment gateway');
    });

    it('should auto-increment order for multiple stories', async () => {
      const room = await createRoomFixture(prisma);

      await request(app.getHttpServer())
        .post(`/api/rooms/${room.id}/stories`)
        .send({ title: 'Story 1' });

      const response = await request(app.getHttpServer())
        .post(`/api/rooms/${room.id}/stories`)
        .send({ title: 'Story 2' })
        .expect(201);

      expect(response.body.order).toBe(1);
    });

    it('should reject story without title', async () => {
      const room = await createRoomFixture(prisma);

      await request(app.getHttpServer())
        .post(`/api/rooms/${room.id}/stories`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/rooms/:roomId/stories', () => {
    it('should return all stories for room ordered by order', async () => {
      const room = await createRoomFixture(prisma);
      await createStoryFixture(prisma, room.id, { title: 'Story A', order: 1 });
      await createStoryFixture(prisma, room.id, { title: 'Story B', order: 0 });

      const response = await request(app.getHttpServer())
        .get(`/api/rooms/${room.id}/stories`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Story B'); // order 0
      expect(response.body[1].title).toBe('Story A'); // order 1
    });

    it('should return empty array for room with no stories', async () => {
      const room = await createRoomFixture(prisma);

      const response = await request(app.getHttpServer())
        .get(`/api/rooms/${room.id}/stories`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/stories/:id', () => {
    it('should return single story with votes', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id, {
        title: 'Single Story',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/stories/${story.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: story.id,
        title: 'Single Story',
        votes: [],
      });
    });

    it('should return 404 for non-existent story', async () => {
      await request(app.getHttpServer())
        .get('/api/stories/non-existent-uuid')
        .expect(404);
    });
  });

  describe('PATCH /api/stories/:id', () => {
    it('should update story properties', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id, {
        title: 'Original',
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/stories/${story.id}`)
        .send({
          title: 'Updated Title',
          description: 'Added description',
          status: 'voting',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: story.id,
        title: 'Updated Title',
        description: 'Added description',
        status: 'voting',
      });
    });

    it('should update estimate', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id);

      const response = await request(app.getHttpServer())
        .patch(`/api/stories/${story.id}`)
        .send({ estimate: '5' })
        .expect(200);

      expect(response.body.estimate).toBe('5');
    });
  });

  describe('DELETE /api/stories/:id', () => {
    it('should delete existing story', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id);

      await request(app.getHttpServer())
        .delete(`/api/stories/${story.id}`)
        .expect(204);

      const deletedStory = await prisma.story.findUnique({
        where: { id: story.id },
      });
      expect(deletedStory).toBeNull();
    });

    it('should return 404 for non-existent story', async () => {
      await request(app.getHttpServer())
        .delete('/api/stories/non-existent-uuid')
        .expect(404);
    });
  });

  describe('POST /api/rooms/:roomId/stories/reorder', () => {
    it('should reorder stories', async () => {
      const room = await createRoomFixture(prisma);
      const story1 = await createStoryFixture(prisma, room.id, {
        title: 'First',
        order: 0,
      });
      const story2 = await createStoryFixture(prisma, room.id, {
        title: 'Second',
        order: 1,
      });

      const response = await request(app.getHttpServer())
        .post(`/api/rooms/${room.id}/stories/reorder`)
        .send({ storyIds: [story2.id, story1.id] })
        .expect(201);

      expect(response.body[0].id).toBe(story2.id);
      expect(response.body[0].order).toBe(0);
      expect(response.body[1].id).toBe(story1.id);
      expect(response.body[1].order).toBe(1);
    });
  });
});
