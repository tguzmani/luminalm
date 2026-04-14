export interface EntryChunkResult {
  id: string;
  content: string;
  chunkIndex: number;
  similarity: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PromptInput {
  systemInstruction: string;
  relevantChunks: EntryChunkResult[];
  conversationHistory: ConversationMessage[];
  userQuery: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
