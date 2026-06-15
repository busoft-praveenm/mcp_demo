const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage } = require('@langchain/core/messages');

async function main() {
  console.log("Starting test...");
  const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: 'AQ.Ab8RN6JxV1tvKjpkVpa6yJLPEAC5i9GOUffDkc1uPv1F_cpUXQ',
    temperature: 0,
    maxRetries: 1, // Set max retries to 1 so it fails fast!
  });

  try {
    const res = await llm.invoke([new HumanMessage('Hello')]);
    console.log("Response:", res.content);
  } catch(e) {
    console.error("Error:", e.message);
  }
}

main();
