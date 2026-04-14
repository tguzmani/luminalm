import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingResult } from './interfaces/embedding.interface';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get apiKey(): string {
    const key = this.config.get<string>('OPENROUTER_API_KEY');
    if (!key) throw new Error('OPENROUTER_API_KEY is not configured');
    return key;
  }

  private async getEmbeddingModel(): Promise<string> {
    const config = await this.prisma.appConfig.findUniqueOrThrow({
      where: { key: 'embedding_model' },
    });
    return config.value;
  }

  async embed(input: string): Promise<number[]> {
    const results = await this.embedMany([input]);
    return results[0].embedding;
  }

  async embedMany(inputs: string[]): Promise<EmbeddingResult[]> {
    const model = await this.getEmbeddingModel();

    const response = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: inputs,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenRouter embeddings error: ${response.status} ${error}`);
      throw new Error(`OpenRouter embeddings error: ${response.status}`);
    }

    const json = (await response.json()) as {
      data: { embedding: number[]; index: number }[];
    };

    return json.data.map((item) => ({
      embedding: item.embedding,
      index: item.index,
    }));
  }
}
