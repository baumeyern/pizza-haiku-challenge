import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateHaiku(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 100,
    system: "Write a haiku based on the user's prompt. Reply with ONLY the haiku, nothing else. No title, no explanation.",
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type === "text") return block.text.trim();
  throw new Error("Unexpected response from Claude");
}

export async function judgeHaiku(haiku: string): Promise<boolean> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 50,
    system:
      'You are a judge. Does the following haiku describe pizza (the food)? Consider references to ingredients, preparation, eating, or characteristics of pizza. Reply ONLY with JSON: {"isPizza": true} or {"isPizza": false}',
    messages: [{ role: "user", content: haiku }],
  });

  const block = response.content[0];
  if (block.type === "text") {
    const parsed = JSON.parse(block.text.trim());
    return parsed.isPizza === true;
  }
  throw new Error("Unexpected response from Claude");
}
