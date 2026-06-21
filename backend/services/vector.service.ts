import { Types } from 'mongoose';
import { VectorMemory, IVectorMemory } from '../models/memory.model';
import { aiService } from './ai.service';
import { logger } from './database.service';

export class VectorService {
  /**
   * Generates an embedding and stores a new memory inside MongoDB
   */
  async storeMemory(
    userId: string | Types.ObjectId,
    content: string,
    sourceModule: IVectorMemory['sourceModule'],
    metadata: Record<string, any> = {}
  ): Promise<IVectorMemory | null> {
    try {
      if (!content.trim()) return null;

      // 1. Generate text embedding
      const embedding = await aiService.generateEmbedding(content);
      
      if (!embedding || embedding.length === 0) {
        throw new Error('Failed to generate embedding');
      }

      // 2. Store in MongoDB
      const memory = await VectorMemory.create({
        userId: new Types.ObjectId(userId),
        content,
        embedding,
        sourceModule,
        metadata
      });

      logger.info(`💾 Stored new ${sourceModule} memory for user ${userId}`);
      return memory;
    } catch (error) {
      logger.error('Error storing vector memory:', error);
      return null;
    }
  }

  /**
   * Deletes memories that match certain metadata criteria (e.g., specific reportId)
   */
  async deleteMemoryByMetadata(userId: string | Types.ObjectId, criteria: Record<string, any>): Promise<void> {
    try {
      const query: any = { userId: new Types.ObjectId(userId) };
      // Map criteria to metadata fields (e.g. metadata.reportId)
      for (const [key, value] of Object.entries(criteria)) {
        query[`metadata.${key}`] = value;
      }
      const result = await VectorMemory.deleteMany(query);
      logger.debug(`🗑️ Deleted ${result.deletedCount} memories for user ${userId} matching criteria:`, criteria);
    } catch (error) {
      logger.error('Error deleting vector memory:', error);
    }
  }

  /**
   * Fetches contextually similar memories for a given query (RAG mechanism)
   */
  async queryMemory(
    userId: string | Types.ObjectId,
    queryText: string,
    limit: number = 5,
    filterModule?: IVectorMemory['sourceModule']
  ): Promise<IVectorMemory[]> {
    try {
      if (!queryText.trim()) return [];

      // 1. Generate an embedding for the query prompt
      const queryEmbedding = await aiService.generateEmbedding(queryText);
      if (!queryEmbedding || queryEmbedding.length === 0) return [];

      // 2. Fetch all candidate memories for this user from DB 
      //    (Optional: filter by module if specified)
      const filter: any = { userId: new Types.ObjectId(userId) };
      if (filterModule) filter.sourceModule = filterModule;

      // Because this is local, we fetch user's documents and do Cosine Similarity in NodeJS.
      // This scales extremely well for per-user data without needing Pinecone/Atlas Vector Search.
      const candidateMemories = await VectorMemory.find(filter).lean() as unknown as IVectorMemory[];
      
      if (candidateMemories.length === 0) return [];

      // 3. Compute inner product / cosine similarity
      // We assume embeddings are normalized, so Dot Product == Cosine Similarity
      const scoredMemories = candidateMemories.map(mem => {
        const score = this.cosineSimilarity(queryEmbedding, mem.embedding);
        return { memory: mem, score };
      });

      // 4. Sort strictly descending by similarity score, slice top K
      scoredMemories.sort((a, b) => b.score - a.score);
      
      return scoredMemories.slice(0, limit).map(sm => sm.memory as IVectorMemory);
    } catch (error) {
      logger.error('Error querying vector memory:', error);
      return [];
    }
  }

  /**
   * Helper function: Calculate Cosine Similarity between two arrays
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    // We assume vecA and vecB are identical dimension.
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += (vecA[i] * vecB[i]) || 0;
        normA += (vecA[i] * vecA[i]) || 0;
        normB += (vecB[i] * vecB[i]) || 0;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const vectorService = new VectorService();
