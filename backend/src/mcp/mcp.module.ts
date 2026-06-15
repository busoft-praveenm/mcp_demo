import { Module } from '@nestjs/common';
import { McpService } from './mcp.service';
import { McpController } from './mcp.controller';
import { TicketModule } from '../ticket/ticket.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [TicketModule],
  providers: [McpService, PrismaService],
  controllers: [McpController]
})
export class McpModule {}
