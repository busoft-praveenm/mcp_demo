import { Controller, Get, Post, Body, Param, Put, Patch } from '@nestjs/common';
import { TicketService } from './ticket.service';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  findAll() {
    return this.ticketService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.ticketService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketService.findOne(+id);
  }

  @Post()
  create(@Body() createTicketDto: any) {
    return this.ticketService.create(createTicketDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: any) {
    return this.ticketService.update(+id, updateTicketDto);
  }
}
