import { Injectable, OnModuleInit, Req, Res } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TicketService } from '../ticket/ticket.service';
import { PrismaService } from '../prisma.service';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

@Injectable()
export class McpService implements OnModuleInit {
  private server: Server;
  private transport: SSEServerTransport | null = null;

  constructor(
    private readonly ticketService: TicketService,
    private readonly prisma: PrismaService
  ) {}

  onModuleInit() {
    this.server = new Server({
      name: 'ticketing-system-mcp',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_tickets',
            description: 'Get a list of all tickets',
            inputSchema: zodToJsonSchema(z.object({})) as any,
          },
          {
            name: 'list_users',
            description: 'Get a list of all users to identify their IDs and roles',
            inputSchema: zodToJsonSchema(z.object({})) as any,
          },
          {
            name: 'get_ticket',
            description: 'Get details of a specific ticket',
            inputSchema: zodToJsonSchema(z.object({
              id: z.number().describe('Ticket ID'),
            })) as any,
          },
          {
            name: 'edit_ticket',
            description: 'Edit a ticket. Only provide the fields you explicitly want to change. Others will be kept the same.',
            inputSchema: zodToJsonSchema(z.object({
              id: z.number().describe('Ticket ID'),
              title: z.string().optional().describe('New Title'),
              description: z.string().optional().describe('New Description'),
              status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional().describe('New Status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)'),
              priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().describe('New Priority (LOW, MEDIUM, HIGH, URGENT)'),
              assigneeId: z.number().optional().describe('New User ID of the assignee'),
            })) as any,
          },
          {
            name: 'create_ticket',
            description: 'Create a new ticket',
            inputSchema: zodToJsonSchema(z.object({
              title: z.string().describe('Title of the ticket'),
              description: z.string().describe('Description of the issue'),
              priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().describe('Priority (LOW, MEDIUM, HIGH, URGENT)'),
              authorId: z.number().describe('ID of the user creating the ticket'),
              assigneeId: z.number().optional().describe('Optional User ID of the assignee'),
            })) as any,
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'list_tickets') {
        const tickets = await this.ticketService.findAll();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tickets, null, 2),
            },
          ],
        };
      }
      if (request.params.name === 'list_users') {
        const users = await this.prisma.user.findMany({
          select: { id: true, name: true, email: true, role: true }
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(users, null, 2),
            },
          ],
        };
      }
      if (request.params.name === 'get_ticket') {
        const id = Number(request.params.arguments?.id);
        const ticket = await this.ticketService.findOne(id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(ticket, null, 2),
            },
          ],
        };
      }
      if (request.params.name === 'edit_ticket') {
        const id = Number(request.params.arguments?.id);
        const data: any = {};
        if (request.params.arguments?.title) data.title = String(request.params.arguments.title);
        if (request.params.arguments?.description) data.description = String(request.params.arguments.description);
        if (request.params.arguments?.status) data.status = String(request.params.arguments.status).toUpperCase();
        if (request.params.arguments?.priority) data.priority = String(request.params.arguments.priority).toUpperCase();
        if (request.params.arguments?.assigneeId) data.assigneeId = Number(request.params.arguments.assigneeId);
        
        await this.ticketService.update(id, data);
        return {
          content: [{ type: 'text', text: `Successfully updated ticket #${id}` }],
        };
      }
      if (request.params.name === 'create_ticket') {
        const title = String(request.params.arguments?.title);
        const description = String(request.params.arguments?.description);
        const rawPriority = request.params.arguments?.priority ? String(request.params.arguments.priority).toUpperCase() : 'MEDIUM';
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        const priority = validPriorities.includes(rawPriority) ? rawPriority : 'MEDIUM';
        const authorId = Number(request.params.arguments?.authorId);
        if (!authorId || isNaN(authorId)) {
          return { content: [{ type: 'text', text: 'Error: Missing or invalid authorId. Cannot create ticket.' }] };
        }
        const assigneeId = request.params.arguments?.assigneeId ? Number(request.params.arguments.assigneeId) : undefined;
        
        const ticket = await this.ticketService.create({ title, description, priority, authorId, assigneeId });
        return {
          content: [{ type: 'text', text: `Successfully created ticket #${ticket.id} "${title}"` }],
        };
      }
      throw new Error('Tool not found');
    });
  }

  async handleSseConnection(@Req() req: Request, @Res() res: Response) {
    this.transport = new SSEServerTransport('/mcp/messages', res);
    await this.server.connect(this.transport);
  }

  async handleMessage(@Req() req: Request, @Res() res: Response) {
    if (this.transport) {
      await this.transport.handlePostMessage(req, res, req.body);
    } else {
      res.status(500).send('MCP Transport not initialized');
    }
  }
}
