import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { HumanMessage } from '@langchain/core/messages';

async function main() {
  const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: 'AQ.Ab8RN6JxV1tvKjpkVpa6yJLPEAC5i9GOUffDkc1uPv1F_cpUXQ',
    temperature: 0,
  });

  const tool = new DynamicStructuredTool({
    name: 'create_ticket',
    description: 'Create a ticket',
    schema: z.object({ title: z.string() }),
    func: async () => 'Success',
  });

  const llmWithTools = llm.bindTools([tool]);

  const res = await llmWithTools.invoke([new HumanMessage('Create a ticket with title Hello')]);
  console.log("TOOL CALLS:", JSON.stringify(res.tool_calls, null, 2));
  console.log("CONTENT:", JSON.stringify(res.content, null, 2));
}

main().catch(console.error);
