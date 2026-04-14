import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatMessage } from '../prompt/prompt.types';
import {
  ChatCompletionOptions,
  ChatCompletionChunk,
} from './interfaces/llm.interface';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get apiKey(): string {
    const key = this.config.get<string>('OPENROUTER_API_KEY');
    if (!key) throw new Error('OPENROUTER_API_KEY is not configured');
    return key;
  }

  private async getLlmModel(): Promise<string> {
    const config = await this.prisma.appConfig.findUniqueOrThrow({
      where: { key: 'llm_model' },
    });
    return config.value;
  }

  async *streamChatCompletion(
    options: ChatCompletionOptions,
  ): AsyncGenerator<ChatCompletionChunk> {
    const model = await this.getLlmModel();

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        stream: true,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenRouter API error: ${response.status} ${error}`);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') return;

          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          const finishReason = parsed.choices?.[0]?.finish_reason ?? null;

          if (delta?.content) {
            yield { content: delta.content, finishReason };
          } else if (finishReason) {
            yield { content: '', finishReason };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async chatCompletion(
    messages: ChatMessage[],
    temperature?: number,
  ): Promise<string> {
    const chunks: string[] = [];
    for await (const chunk of this.streamChatCompletion({
      messages,
      temperature,
    })) {
      chunks.push(chunk.content);
    }
    return chunks.join('');
  }
}
