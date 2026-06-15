import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TicketService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.ticket.findMany({
      include: {
        author: { select: { name: true } },
        assignee: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: { assignee: true, comments: { include: { author: true } } },
    });
  }

  async create(data: { title: string; description: string; priority?: any; status?: any; assigneeId?: number; authorId: number }) {
    return this.prisma.ticket.create({ data });
  }

  async update(id: number, data: any) {
    return this.prisma.ticket.update({ where: { id }, data });
  }

  async getStats() {
    const open = await this.prisma.ticket.count({ where: { status: 'OPEN' } });
    const inProgress = await this.prisma.ticket.count({ where: { status: 'IN_PROGRESS' } });
    const resolved = await this.prisma.ticket.count({ where: { status: 'RESOLVED' } });
    
    return {
      open,
      inProgress,
      resolved
    };
  }
}
