import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  const prisma = app.get(PrismaService);

  return { app, prisma };
}

export async function cleanupDatabase(prisma: PrismaService): Promise<void> {
  // Delete in order of dependencies (votes → stories/participants → rooms)
  await prisma.vote.deleteMany();
  await prisma.story.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.room.deleteMany();
}

export interface RoomFixture {
  id: string;
  name: string;
  password?: string;
  votingScale: string;
}

export interface ParticipantFixture {
  id: string;
  roomId: string;
  name: string;
  role: string;
}

export interface StoryFixture {
  id: string;
  roomId: string;
  title: string;
  order: number;
  status: string;
}

export async function createRoomFixture(
  prisma: PrismaService,
  data: Partial<RoomFixture> = {},
): Promise<RoomFixture> {
  const room = await prisma.room.create({
    data: {
      name: data.name ?? 'Test Room',
      password: data.password,
      votingScale: data.votingScale ?? 'fibonacci',
    },
  });
  return room as RoomFixture;
}

export async function createParticipantFixture(
  prisma: PrismaService,
  roomId: string,
  data: Partial<ParticipantFixture> = {},
): Promise<ParticipantFixture> {
  const participant = await prisma.participant.create({
    data: {
      roomId,
      name: data.name ?? 'Test User',
      role: data.role ?? 'voter',
    },
  });
  return participant as ParticipantFixture;
}

export async function createStoryFixture(
  prisma: PrismaService,
  roomId: string,
  data: Partial<StoryFixture> = {},
): Promise<StoryFixture> {
  const story = await prisma.story.create({
    data: {
      roomId,
      title: data.title ?? 'Test Story',
      order: data.order ?? 0,
      status: data.status ?? 'pending',
    },
  });
  return story as StoryFixture;
}
