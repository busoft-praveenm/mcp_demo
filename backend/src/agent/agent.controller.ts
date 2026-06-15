import { Controller, Post, Body, Get } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { z } from 'zod';
import { SystemMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';

@Controller('agent')
export class AgentController {
  private mcpClient: Client;

  constructor() {}

  @Get('tools')
  async getTools() {
    const client = await this.getMcpClient();
    const toolsResponse = await client.listTools();
    return toolsResponse.tools;
  }

  private getLlm(model: string) {
    if (model === 'claude') {
      return new ChatAnthropic({
        modelName: 'claude-3-opus-20240229',
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        temperature: 0,
        maxRetries: 0,
      });
    } else if (model === 'llama') {
      return new ChatOpenAI({
        modelName: 'local-model',
        apiKey: 'dummy-key',
        configuration: {
          baseURL: 'http://127.0.0.1:8080/v1',
        },
        temperature: 0.1,
        maxRetries: 0,
      });
    } else {
      // Default to Gemini
      return new ChatGoogleGenerativeAI({
        model: 'gemini-flash-lite-latest',
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0,
        maxRetries: 0,
      });
    }
  }

  private async getMcpClient() {
    if (!this.mcpClient) {
      const transport = new SSEClientTransport(new URL('http://localhost:3000/mcp/sse'));
      this.mcpClient = new Client({ name: 'agent-client', version: '1.0.0' }, { capabilities: {} });
      await this.mcpClient.connect(transport);
    }
    return this.mcpClient;
  }

  @Post('chat')
  async chat(@Body() body: { message: string, authorId: number, model?: string }) {
    try {
      const client = await this.getMcpClient();
      const llm = this.getLlm(body.model || 'gemini');
      const toolsResponse = await client.listTools();
      
      const lcTools = toolsResponse.tools.map(tool => {
        // Dynamic convert MCP JSON schema to Zod is complex, we will manually define for demo 
        // or just use generic any schema.
        let schema: any = z.object({});
        if (tool.name === 'get_ticket') schema = z.object({ id: z.number().describe('Ticket ID') });
        if (tool.name === 'list_tickets') schema = z.object({});
        if (tool.name === 'edit_ticket') schema = z.object({ 
          id: z.number(), 
          title: z.string().optional(), 
          description: z.string().optional(), 
          status: z.string().optional(), 
          priority: z.string().optional(), 
          assigneeId: z.number().optional() 
        });
        if (tool.name === 'list_users') schema = z.object({});
        if (tool.name === 'create_ticket') schema = z.object({ 
          title: z.string(), 
          description: z.string(), 
          priority: z.string().optional(), 
          authorId: z.number().optional(), 
          assigneeId: z.number().optional() 
        });

        return new DynamicStructuredTool({
          name: tool.name,
          description: tool.description || '',
          schema,
          func: async (args: any) => {
            if (tool.name === 'create_ticket' && !args.authorId) {
              args.authorId = body.authorId;
            }
            const result = await client.callTool({
              name: tool.name,
              arguments: args as any,
            });
            return JSON.stringify(result.content);
          },
        });
      });

      const isLlama = body.model === 'llama';
      const activeLlm = isLlama ? llm : llm.bindTools(lcTools);
      
      // Basic agent loop
      let systemPrompt = `You are a helpful IT Service Desk AI Agent. 
You can manage tickets using your tools. Always reply concisely.
If a user asks you to assign a ticket to someone (like an IT admin), use the list_users tool to find their user ID first!
When creating a ticket, always use ${body.authorId} as the authorId unless specified otherwise.
Do not guess or assume missing information. If a user asks to create a ticket but doesn't specify a title, description, or priority, you MUST ask the user for these details before calling the create_ticket tool.
When users ask you to do something, use your tools to perform the action and tell them the result.`;

      if (isLlama) {
        systemPrompt += `\n\nAVAILABLE TOOLS:
${lcTools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

CRITICAL INSTRUCTIONS: 
1. To use a tool, you MUST reply ONLY with a JSON array containing the tool calls. Do not output any conversational text.
Format exactly like this:
[{"name": "tool_name", "args": {"param1": "value1"}}]

2. Once you have used the necessary tools and the task is complete, you MUST reply with a normal natural language message to the user summarizing what you did. DO NOT output a JSON array when you are finished. Just speak normally!

3. When using edit_ticket, ONLY include the specific fields that the user explicitly asked to change! DO NOT copy other fields like status or priority from the examples unless the user requested to change them.

EXAMPLE 1 - Finding users:
[{"name": "list_users", "args": {}}]

EXAMPLE 2 - Creating a ticket:
[{"name": "create_ticket", "args": {"title": "Issue", "description": "Details", "priority": "URGENT", "authorId": ${body.authorId}, "assigneeId": 2}}]

EXAMPLE 3 - Editing ONLY the assignee:
[{"name": "edit_ticket", "args": {"id": 1, "assigneeId": 2}}]

EXAMPLE 4 - Editing ONLY the status and priority:
[{"name": "edit_ticket", "args": {"id": 1, "status": "CLOSED", "priority": "LOW"}}]

If you need to assign a ticket to an IT Admin, you must FIRST call list_users to find their ID. Do not call create_ticket until you know the assigneeId!
`;
      }

      let messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(body.message)
      ] as any[];

      let response = await activeLlm.invoke(messages);
      let iterations = 0;
      
      while (iterations < 3) {
        let toolCalls = response.tool_calls || [];
        
        // Manual parsing for LLaMA model
        if (isLlama && typeof response.content === 'string') {
          const startIdx = response.content.indexOf('[');
          const endIdx = response.content.lastIndexOf(']');
          
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            let contentStr = response.content.substring(startIdx, endIdx + 1);
            let parsed;
            try {
              parsed = JSON.parse(contentStr);
            } catch (e) {
              // Attempt to repair common LLaMA hallucination: missing outer brace
              if (contentStr.endsWith('}]') && !contentStr.endsWith('}}]')) {
                try {
                  parsed = JSON.parse(contentStr.replace(/}\]$/, '}}]'));
                } catch (e2) {
                  console.log("Failed to repair LLaMA manual tool call:", contentStr);
                }
              } else {
                console.log("Failed to parse LLaMA manual tool call:", contentStr);
              }
            }

          if (parsed && Array.isArray(parsed)) {
            toolCalls = parsed.map(tc => {
              const args = tc.args || tc.parameters || {};
              // Map common hallucinations and coerce string IDs to numbers for LLaMA
              for (const key in args) {
                let mappedKey = key;
                if (key === 'ticket_id' || key === 'ticketId') mappedKey = 'id';
                if (key === 'assignee_id') mappedKey = 'assigneeId';
                if (key === 'author_id') mappedKey = 'authorId';
                
                if (mappedKey !== key) {
                   args[mappedKey] = args[key];
                   delete args[key];
                }

                if (typeof args[mappedKey] === 'string' && !isNaN(Number(args[mappedKey])) && (mappedKey === 'id' || mappedKey.endsWith('Id'))) {
                   args[mappedKey] = Number(args[mappedKey]);
                }
              } // Closed for loop

              // Clean up spaces in enums and swap status/priority if LLaMA confused them
              if (args.status) args.status = String(args.status).toUpperCase().replace(/\s+/g, '_');
              if (args.priority) args.priority = String(args.priority).toUpperCase().replace(/\s+/g, '_');
              
              const s = args.status;
              const p = args.priority;
              
              if (s && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(s) && p && ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(p)) {
                 args.priority = s;
                 args.status = p;
              } else if (s && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(s)) {
                 args.priority = s;
                 delete args.status;
              } else if (p && ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(p)) {
                 args.status = p;
                 delete args.priority;
              }

              return {
                name: tc.name || tc.function,
                args: args,
                id: 'call_' + Math.random().toString(36).substr(2, 9),
                type: 'tool_call'
              };
            });
          }
          } // Closed if (startIdx !== -1)
        }

        if (!toolCalls || toolCalls.length === 0) {
          break;
        }

        let toolResults: any[] = [];
        for (const call of toolCalls) {
          const toolName = call.name;
          const tool = lcTools.find(t => t.name === toolName);
          if (tool) {
            try {
              const res = await tool.invoke(call.args);
              if (isLlama) {
                toolResults.push(new HumanMessage(`Tool '${toolName}' executed successfully. Result:\n${res}`));
              } else {
                toolResults.push(new ToolMessage({ tool_call_id: call.id || '', content: res, name: toolName }));
              }
            } catch (err: any) {
              if (isLlama) {
                toolResults.push(new HumanMessage(`Tool '${toolName}' failed. Error:\n${err.message}`));
              } else {
                toolResults.push(new ToolMessage({ tool_call_id: call.id || '', content: "Error: " + err.message, name: toolName }));
              }
            }
          } else {
             if (isLlama) {
                toolResults.push(new HumanMessage(`Error: Tool '${toolName}' not found. Please use one of the available tools.`));
             } else {
                toolResults.push(new ToolMessage({ tool_call_id: call.id || '', content: "Error: Tool not found", name: toolName }));
             }
          }
        }
        
        messages.push(response);
        messages.push(...toolResults);
        
        response = await activeLlm.invoke(messages);
        iterations++;
      }

      let reply = response.content;
      if (typeof reply !== 'string') {
         reply = JSON.stringify(reply);
      }
      return { reply };
    } catch (e) {
      console.error(e);
      return { reply: 'Error processing your request: ' + e.message };
    }
  }
}
