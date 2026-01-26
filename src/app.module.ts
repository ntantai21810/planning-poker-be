import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma';
import { RoomsModule } from './rooms/rooms.module';
import { StoriesModule } from './stories/stories.module';
import { VotesModule } from './votes/votes.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RoomsModule,
    StoriesModule,
    VotesModule,
    GatewayModule,
  ],
})
export class AppModule { }
