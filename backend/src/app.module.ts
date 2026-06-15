import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketModule } from './ticket/ticket.module';
import { McpModule } from './mcp/mcp.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [TicketModule, McpModule, PrismaModule, AuthModule, UserModule, AgentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
