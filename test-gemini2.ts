import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { HumanMessage, ToolMessage, AIMessage } from '@langchain/core/messages';

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
    func: async () => 'Success ticket created',
  });

  const llmWithTools = llm.bindTools([tool]);

  const res = await llmWithTools.invoke([new HumanMessage('Create a ticket with title Hello')]);
  
  const messages = [
    new HumanMessage('Create a ticket with title Hello'),
    res,
    new ToolMessage({ tool_call_id: res.tool_calls![0].id, content: "Successfully created ticket 123", name: "create_ticket" })
  ];

  const finalRes = await llmWithTools.invoke(messages);
  console.log("FINAL CONTENT:", JSON.stringify(finalRes.content, null, 2));
}

main().catch(console.error);
