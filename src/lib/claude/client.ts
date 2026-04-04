import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage } from '@/types';
import { getSettings } from '@/lib/settings';

export async function streamChat(
  systemPrompt: string,
  chatMessages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const settings = getSettings();
  const apiKey = settings.apiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('No API key configured');
  }

  const client = new Anthropic({ apiKey });

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: chatMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
