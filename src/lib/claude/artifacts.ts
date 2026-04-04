import type { ParsedArtifact } from '@/types';

const ARTIFACT_REGEX = /```artifact\s*(\{[\s\S]*?\})\s*```/g;

export function parseArtifacts(text: string): ParsedArtifact[] {
  const artifacts: ParsedArtifact[] = [];
  let match;

  while ((match = ARTIFACT_REGEX.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.type && parsed.data) {
        artifacts.push({
          type: parsed.type,
          data: parsed.data,
        });
      }
    } catch {
      // Invalid JSON — skip this block
    }
  }

  // Reset regex state
  ARTIFACT_REGEX.lastIndex = 0;

  return artifacts;
}

export function stripArtifactBlocks(text: string): string {
  const result = text.replace(ARTIFACT_REGEX, '').trim();
  ARTIFACT_REGEX.lastIndex = 0;
  return result;
}
