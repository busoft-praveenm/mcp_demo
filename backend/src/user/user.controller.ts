import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('users')
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });
  }
}
