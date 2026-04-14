import { ChatMessage } from '../../prompt/prompt.types';

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionChunk {
  content: string;
  finishReason: string | null;
}
