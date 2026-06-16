import { Controller, Get, Post, Req, Res, Param } from '@nestjs/common';
import { McpService } from './mcp.service';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Get('sse')
  async sse(@Req() req: Request, @Res() res: Response) {
    await this.mcpService.handleSseConnection(req, res);
  }

  @Post('messages')
  async messages(@Req() req: Request, @Res() res: Response) {
    await this.mcpService.handleMessage(req, res);
  }

  @Get('download/:filename')
  downloadFile(@Param('filename') filename: string, @Res() res: Response) {
    // Only allow .pdf extension for basic security
    if (!filename.endsWith('.pdf')) {
      return res.status(400).send('Invalid file type');
    }
    const file = path.join(os.tmpdir(), filename);
    if (fs.existsSync(file)) {
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
      const fileStream = fs.createReadStream(file);
      fileStream.pipe(res);
    } else {
      res.status(404).send('File not found');
    }
  }
}
