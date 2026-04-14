import {
  ChatMessage,
  ConversationMessage,
  EntryChunkResult,
} from './prompt.types';

export class PromptBuilder {
  private systemInstruction = '';
  private relevantChunks: EntryChunkResult[] = [];
  private conversationHistory: ConversationMessage[] = [];
  private userQuery = '';

  setSystem(instruction: string): this {
    this.systemInstruction = instruction;
    return this;
  }

  setRelevantChunks(chunks: EntryChunkResult[]): this {
    this.relevantChunks = chunks;
    return this;
  }

  setConversationHistory(messages: ConversationMessage[]): this {
    this.conversationHistory = messages;
    return this;
  }

  setUserQuery(query: string): this {
    this.userQuery = query;
    return this;
  }

  build(): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // 1. System instruction — always first
    messages.push({
      role: 'system',
      content: this.systemInstruction,
    });

    // 2. Relevant chunks — most relevant first (already ordered by similarity desc)
    if (this.relevantChunks.length > 0) {
      const chunksText = this.relevantChunks
        .map(
          (chunk, i) =>
            `[Source ${i + 1}] (similarity: ${chunk.similarity.toFixed(3)})\n${chunk.content}`,
        )
        .join('\n\n');

      messages.push({
        role: 'system',
        content: `Here are relevant excerpts from the user's journal:\n\n${chunksText}`,
      });
    }

    // 3. Conversation history — in the middle
    for (const msg of this.conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // 4. User query — always last
    messages.push({
      role: 'user',
      content: this.userQuery,
    });

    return messages;
  }
}
