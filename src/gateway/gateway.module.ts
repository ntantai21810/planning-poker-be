import { Module } from '@nestjs/common';
import { PokerGateway } from './poker.gateway';

@Module({
    providers: [PokerGateway],
    exports: [PokerGateway],
})
export class GatewayModule { }
