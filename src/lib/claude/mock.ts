import type { ChatMessage } from '@/types';
import { getMockScript } from '@/lib/mock-script-store';

export async function mockStreamChat(
  _systemPrompt: string,
  _chatMessages: ChatMessage[],
  stageId?: string
): Promise<ReadableStream<Uint8Array>> {
  const script = getMockScript();
  const responseText = (stageId && script[stageId]) || script['_default'] || 'No mock response configured for this stage.';
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      // Simulate streaming by sending chunks with small delays
      const words = responseText.split(' ');
      let chunk = '';

      for (let i = 0; i < words.length; i++) {
        chunk += (i === 0 ? '' : ' ') + words[i];

        // Send every few words to simulate streaming
        if (chunk.length > 20 || i === words.length - 1) {
          controller.enqueue(encoder.encode(chunk));
          chunk = '';
          // Small delay to simulate streaming
          await new Promise((resolve) => setTimeout(resolve, 15));
        }
      }

      controller.close();
    },
  });
}
