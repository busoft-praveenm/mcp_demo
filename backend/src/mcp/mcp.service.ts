import { Injectable, OnModuleInit, Req, Res } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TicketService } from '../ticket/ticket.service';
import { PrismaService } from '../prisma.service';
import type { Request, Response } from 'express';

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
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'list_users',
            description: 'Get a list of all users to identify their IDs and roles',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_ticket',
            description: 'Get details of a specific ticket',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Ticket ID' },
              },
              required: ['id'],
            },
          },
          {
            name: 'edit_ticket',
            description: 'Edit a ticket. Only provide the fields you explicitly want to change. Others will be kept the same.',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Ticket ID' },
                title: { type: 'string', description: 'New Title' },
                description: { type: 'string', description: 'New Description' },
                status: { type: 'string', description: 'New Status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)' },
                priority: { type: 'string', description: 'New Priority (LOW, MEDIUM, HIGH, URGENT)' },
                assigneeId: { type: 'number', description: 'New User ID of the assignee' },
              },
              required: ['id'],
            },
          },
          {
            name: 'create_ticket',
            description: 'Create a new ticket',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Title of the ticket' },
                description: { type: 'string', description: 'Description of the issue' },
                priority: { type: 'string', description: 'Priority (LOW, MEDIUM, HIGH, URGENT)' },
                authorId: { type: 'number', description: 'ID of the user creating the ticket' },
                assigneeId: { type: 'number', description: 'Optional User ID of the assignee' }
              },
              required: ['title', 'description', 'authorId'],
            },
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
