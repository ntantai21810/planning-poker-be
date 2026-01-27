import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createTestApp,
  cleanupDatabase,
  createRoomFixture,
  createStoryFixture,
  createParticipantFixture,
} from './test-utils';

describe('VotesController (e2e)', () => {
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

  describe('POST /api/stories/:id/vote', () => {
    it('should submit a new vote', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id);
      const participant = await createParticipantFixture(prisma, room.id);

      const response = await request(app.getHttpServer())
        .post(`/api/stories/${story.id}/vote`)
        .send({
          participantId: participant.id,
          value: '5',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        storyId: story.id,
        participantId: participant.id,
        value: '5',
        participant: expect.objectContaining({ name: 'Test User' }),
      });
    });

    it('should update existing vote (upsert)', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id);
      const participant = await createParticipantFixture(prisma, room.id);

      // First vote
      await request(app.getHttpServer())
        .post(`/api/stories/${story.id}/vote`)
        .send({ participantId: participant.id, value: '3' });

      // Update vote
      const response = await request(app.getHttpServer())
        .post(`/api/stories/${story.id}/vote`)
        .send({ participantId: participant.id, value: '8' })
        .expect(201);

      expect(response.body.value).toBe('8');

      // Verify only one vote exists
      const votes = await prisma.vote.findMany({
        where: { storyId: story.id },
      });
      expect(votes).toHaveLength(1);
    });

    it('should support non-numeric votes', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id);
      const participant = await createParticipantFixture(prisma, room.id);

      const response = await request(app.getHttpServer())
        .post(`/api/stories/${story.id}/vote`)
        .send({ participantId: participant.id, value: '?' })
        .expect(201);

      expect(response.body.value).toBe('?');
    });
  });

  describe('GET /api/stories/:id/votes', () => {
    it('should return all votes for story', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id);
      const participant1 = await createParticipantFixture(prisma, room.id, {
        name: 'Alice',
      });
      const participant2 = await createParticipantFixture(prisma, room.id, {
        name: 'Bob',
      });

      await prisma.vote.createMany({
        data: [
          { storyId: story.id, participantId: participant1.id, value: '3' },
          { storyId: story.id, participantId: participant2.id, value: '5' },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/stories/${story.id}/votes`)
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should return empty array for story with no votes', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id);

      const response = await request(app.getHttpServer())
        .get(`/api/stories/${story.id}/votes`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/stories/:id/reveal', () => {
    it('should reveal votes and update story status', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id, {
        status: 'voting',
      });
      const participant = await createParticipantFixture(prisma, room.id);

      await prisma.vote.create({
        data: {
          storyId: story.id,
          participantId: participant.id,
          value: '5',
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/stories/${story.id}/reveal`)
        .expect(201);

      expect(response.body).toMatchObject({
        votes: expect.any(Array),
        statistics: expect.objectContaining({
          count: 1,
          average: 5,
        }),
      });

      // Verify story status updated
      const updatedStory = await prisma.story.findUnique({
        where: { id: story.id },
      });
      expect(updatedStory?.status).toBe('completed');
    });
  });

  describe('POST /api/stories/:id/reset', () => {
    it('should reset votes and story status', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id, {
        status: 'completed',
      });
      const participant = await createParticipantFixture(prisma, room.id);

      // Create vote
      await prisma.vote.create({
        data: {
          storyId: story.id,
          participantId: participant.id,
          value: '5',
        },
      });

      // Set estimate
      await prisma.story.update({
        where: { id: story.id },
        data: { estimate: '5' },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/stories/${story.id}/reset`)
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify votes deleted
      const votes = await prisma.vote.findMany({
        where: { storyId: story.id },
      });
      expect(votes).toHaveLength(0);

      // Verify story status reset
      const updatedStory = await prisma.story.findUnique({
        where: { id: story.id },
      });
      expect(updatedStory?.status).toBe('voting');
      expect(updatedStory?.estimate).toBeNull();
    });
  });

  describe('GET /api/stories/:id/statistics', () => {
    it('should calculate statistics for numeric votes', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id);
      const participants = await Promise.all([
        createParticipantFixture(prisma, room.id, { name: 'P1' }),
        createParticipantFixture(prisma, room.id, { name: 'P2' }),
        createParticipantFixture(prisma, room.id, { name: 'P3' }),
      ]);

      await prisma.vote.createMany({
        data: [
          { storyId: story.id, participantId: participants[0].id, value: '3' },
          { storyId: story.id, participantId: participants[1].id, value: '5' },
          { storyId: story.id, participantId: participants[2].id, value: '8' },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/stories/${story.id}/statistics`)
        .expect(200);

      expect(response.body).toMatchObject({
        count: 3,
        average: expect.any(Number),
        median: 5,
        min: 3,
        max: 8,
        distribution: { '3': 1, '5': 1, '8': 1 },
        consensus: false,
      });
    });

    it('should detect consensus when all votes match', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id);
      const participants = await Promise.all([
        createParticipantFixture(prisma, room.id, { name: 'P1' }),
        createParticipantFixture(prisma, room.id, { name: 'P2' }),
      ]);

      await prisma.vote.createMany({
        data: [
          { storyId: story.id, participantId: participants[0].id, value: '5' },
          { storyId: story.id, participantId: participants[1].id, value: '5' },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/stories/${story.id}/statistics`)
        .expect(200);

      expect(response.body.consensus).toBe(true);
    });

    it('should return empty statistics when no votes', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id);

      const response = await request(app.getHttpServer())
        .get(`/api/stories/${story.id}/statistics`)
        .expect(200);

      expect(response.body).toMatchObject({
        count: 0,
        average: null,
        median: null,
        consensus: false,
      });
    });

    it('should handle non-numeric votes in statistics', async () => {
      const room = await createRoomFixture(prisma);
      const story = await createStoryFixture(prisma, room.id);
      const participant = await createParticipantFixture(prisma, room.id);

      await prisma.vote.create({
        data: {
          storyId: story.id,
          participantId: participant.id,
          value: '?',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/stories/${story.id}/statistics`)
        .expect(200);

      expect(response.body).toMatchObject({
        count: 1,
        average: null,
        distribution: { '?': 1 },
      });
    });
  });
});
