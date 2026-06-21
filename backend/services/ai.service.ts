import axios from 'axios';
import { BaseService, logger, cacheService } from './database.service';
import { ApiError } from '../utils/errors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const extractOllamaText = (data: any): string => {
  if (!data) return '';
  if (typeof data.response === 'string' && data.response.trim()) return data.response.trim();
  if (typeof data.output === 'string' && data.output.trim()) return data.output.trim();
  if (Array.isArray(data.output)) {
    for (const item of data.output) {
      if (typeof item === 'string' && item.trim()) return item.trim();
      if (Array.isArray(item?.content)) {
        for (const content of item.content) {
          if (typeof content?.text === 'string' && content.text.trim()) return content.text.trim();
          if (typeof content === 'string' && content.trim()) return content.trim();
        }
      }
    }
  }
  if (typeof data.text === 'string' && data.text.trim()) return data.text.trim();
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return '';
};

// ============================================================================
// AI SERVICE CONFIGURATION
// ============================================================================

interface AIProvider {
  name: string;
  generateText(prompt: string, context?: any): Promise<string>;
  isAvailable(): Promise<boolean>;
}

// Primary Provider: Ollama (Local)
class OllamaProvider implements AIProvider {
  name = 'Ollama';
  private baseUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  private model = process.env.OLLAMA_MODEL || 'llama3:latest';

  async isAvailable(): Promise<boolean> {
    const modelPaths = ['/v1/models', '/api/models'];

    for (const path of modelPaths) {
      try {
        const response = await axios.get(`${this.baseUrl}${path}`, {
          timeout: 15000,
          validateStatus: () => true
        });

        if (response.status === 200) {
          return true;
        }
      } catch (error: any) {
        logger.debug(`Ollama model endpoint ${path} failed:`, error.message);
      }
    }

    logger.debug('Ollama not available: no model endpoint responded with 200');
    return false;
  }

  async generateText(prompt: string, context: any = {}): Promise<string> {
    const visionModel = process.env.OLLAMA_VISION_MODEL || 'llava:latest';
    const targetModel = context.imageData
      ? visionModel
      : context.forceModel || process.env.OLLAMA_MODEL || 'llama3:latest';

    try {

      const payload: any = {
        model: targetModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: context.temperature || 0.7,
          num_predict: context.maxTokens || 2048
        }
      };

      if (context.format === 'json') {
        payload.format = 'json';
      }

      if (context.imageData) {
        payload.images = [context.imageData];
      }

      logger.info(`🤖 AI Request (${this.name}):`, { model: targetModel, hasImage: !!context.imageData });

      const generatePaths = ['/api/generate', '/v1/generate'];
      let lastError: any;

      for (const path of generatePaths) {
        try {
          const response = await axios.post(
            `${this.baseUrl}${path}`,
            payload,
            {
              timeout: 600000,
              validateStatus: () => true
            }
          );

          if (response.status === 200) {
            const text = extractOllamaText(response.data);
            return text || '';
          }

          if (response.status === 404) {
            lastError = new Error(`Ollama generate endpoint ${path} returned 404`);
            continue;
          }

          lastError = new Error(`Ollama generate endpoint ${path} returned ${response.status}`);
        } catch (error: any) {
          lastError = error;
          if (error.response?.status === 404) {
            continue;
          }
          throw error;
        }
      }

      throw lastError;
    } catch (error: any) {
      // FALLBACK LOGIC: If vision fails (e.g. missing model), try the base model without images
      if (context.imageData && error.response?.status === 404) {
        logger.warn(`⚠️ Vision model (${process.env.OLLAMA_VISION_MODEL || 'llava:latest'}) not found. Falling back to base model...`);
        const { imageData, ...textContext } = context;
        return this.generateText(`${prompt}\n\n[Note: This analysis was performed on text only as the vision model was unavailable.]`, textContext);
      }

      // FALLBACK LOGIC: If specific model fails with 404, try generic llama3
      if (error.response?.status === 404 && !context.imageData && targetModel !== 'llama3') {
        logger.warn('⚠️ Primary model not found. Trying generic llama3...');
        return this.generateText(prompt, { ...context, forceModel: 'llama3' });
      }

      logger.error(`❌ Ollama API error (${targetModel}):`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        isVision: !!context.imageData
      });
      throw new ApiError(503, `Ollama service error [${targetModel}]: ${error.message} ${error.response?.data?.error || ''}`);
    }
  }
}

// Secondary Provider: Ollama Backup (same as primary but with different model/config if needed)
class OllamaBackupProvider implements AIProvider {
  private baseUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  private model = process.env.OLLAMA_BACKUP_MODEL || 'mistral:latest';

  name = 'OllamaBackup';

  async isAvailable(): Promise<boolean> {
    const modelPaths = ['/v1/models', '/api/models'];

    for (const path of modelPaths) {
      try {
        const response = await axios.get(`${this.baseUrl}${path}`, {
          timeout: 5000,
          validateStatus: () => true
        });

        if (response.status === 200) {
          return true;
        }
      } catch (error: any) {
        logger.debug(`Ollama backup model endpoint ${path} failed:`, error.message);
      }
    }

    return false;
  }

  async generateText(prompt: string, context: any = {}): Promise<string> {
    const visionModel = process.env.OLLAMA_VISION_MODEL || 'llava:latest';
    const targetModel = context.imageData ? visionModel : this.model;

    try {
      const payload: any = {
        model: targetModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: context.temperature || 0.7,
          num_predict: context.maxTokens || 2048
        }
      };

      if (context.format === 'json') {
        payload.format = 'json';
      }

      if (context.imageData) {
        payload.images = [context.imageData];
      }

      const generatePaths = ['/api/generate', '/v1/generate'];
      let lastError: any;

      for (const path of generatePaths) {
        try {
          const response = await axios.post(
            `${this.baseUrl}${path}`,
            payload,
            {
              timeout: 600000,
              validateStatus: () => true
            }
          );

          if (response.status === 200) {
            const text = extractOllamaText(response.data);
            return text || '';
          }

          if (response.status === 404) {
            lastError = new Error(`Ollama backup generate endpoint ${path} returned 404`);
            continue;
          }

          lastError = new Error(`Ollama backup generate endpoint ${path} returned ${response.status}`);
        } catch (error: any) {
          lastError = error;
          if (error.response?.status === 404) {
            continue;
          }
          throw error;
        }
      }

      throw lastError;
    } catch (error: any) {
      // Fallback for vision failure
      if (context.imageData && error.response?.status === 404) {
        const { imageData, ...textContext } = context;
        return this.generateText(prompt, textContext);
      }
      logger.error('Ollama Backup API error:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new ApiError(503, 'Ollama backup service unavailable.');
    }
  }
}

// Tertiary Provider: Google Gemini (Cloud Fallback)
class GeminiProvider implements AIProvider {
  name = 'Gemini';
  private genAI: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.GEMINI_API_KEY;
  }

  async generateText(prompt: string, context: any = {}): Promise<string> {
    try {
      const config: any = {};
      if (context.format === 'json') {
        config.responseMimeType = "application/json";
      }

      const model = this.genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        generationConfig: config
      });

      logger.info(` AI Request (${this.name}):`, { hasImage: !!context.imageData });

      let result;
      if (context.imageData) {
        // Handle potential base64 prefix
        const base64Data = context.imageData.includes(',')
          ? context.imageData.split(',')[1]
          : context.imageData;

        const imageParts = [{
          inlineData: {
            data: base64Data,
            mimeType: context.mimeType || "image/jpeg",
          },
        }];
        result = await model.generateContent([prompt, ...imageParts]);
      } else {
        result = await model.generateContent(prompt);
      }

      const response = await result.response;
      return response.text();
    } catch (error: any) {
      logger.error('Gemini API error:', error.message);
      throw new ApiError(503, 'Gemini service unavailable.');
    }
  }
}

// Quaternary Provider: OpenAI (Ultimate Fallback)
class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  private openai: any;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.OPENAI_API_KEY;
  }

  async generateText(prompt: string, context: any = {}): Promise<string> {
    try {
      logger.info(`✨ AI Request (${this.name}):`, { hasImage: !!context.imageData });

      const messages: any[] = [];

      if (context.imageData) {
        const base64Data = context.imageData.includes(',')
          ? context.imageData.split(',')[1]
          : context.imageData;

        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${context.mimeType || 'image/jpeg'};base64,${base64Data}`
              }
            }
          ]
        });
      } else {
        messages.push({ role: 'user', content: prompt });
      }

      const options: any = {
        model: context.imageData ? "gpt-4o" : "gpt-4o-mini",
        messages,
        temperature: context.temperature || 0.7,
        max_tokens: context.maxTokens || 2048
      };

      if (context.format === 'json') {
        options.response_format = { type: "json_object" };
      }

      const response = await this.openai.chat.completions.create(options);

      return response.choices[0].message.content || '';
    } catch (error: any) {
      logger.error('OpenAI API error:', error.message);
      throw new ApiError(503, `OpenAI service error: ${error.message}`);
    }
  }
}

// Quinary Provider: OpenRouter (Universal Proxy Fallback)
class OpenRouterProvider implements AIProvider {
  name = 'OpenRouter';
  private apiKey: string;
  private model = "meta-llama/llama-3.1-8b-instruct";
  private baseUrl = process.env.OPENROUTER_URL || "https://openrouter.ai/v1";
  private fallbackUrls = [
    "https://api.openrouter.ai/v1",
    "https://api.openrouter.ai",
    "https://openrouter.ai/v1",
    "https://openrouter.ai/api/v1",
    "https://openrouter.ai"
  ];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.OPENROUTER_API_KEY;
  }

  private async postChatCompletion(payload: any): Promise<any> {
    const urls = [this.baseUrl, ...this.fallbackUrls];
    let lastError: any;

    for (const url of urls) {
      try {
        return await axios.post(
          `${url}/chat/completions`,
          payload,
          {
            headers: {
              "Authorization": `Bearer ${this.apiKey}`,
              "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
              "X-Title": "MedSage Health",
              "Content-Type": "application/json"
            },
            timeout: 60000
          }
        );
      } catch (error: any) {
        lastError = error;

        const networkRetryCodes = ['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'EAI_AGAIN', 'ECONNABORTED', 'ENETUNREACH'];
        const isNetworkFailure = networkRetryCodes.includes(error.code) ||
          error.message?.includes('getaddrinfo ENOTFOUND') ||
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ECONNRESET');

        if (error.response?.status === 404) {
          logger.warn(`OpenRouter URL ${url}/chat/completions returned 404; trying next fallback URL.`);
          continue;
        }

        if (isNetworkFailure) {
          logger.warn(`OpenRouter URL ${url}/chat/completions failed with network error (${error.code || error.message}); trying next fallback URL.`);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  async generateText(prompt: string, context: any = {}): Promise<string> {
    try {
      logger.info(`✨ AI Request (${this.name}):`, { hasImage: !!context.imageData });

      const payload: any = {
        model: this.model,
        messages: [{ role: 'user', content: prompt }]
      };

      if (context.imageData) {
        const base64Data = context.imageData.includes(',')
          ? context.imageData.split(',')[1]
          : context.imageData;

        payload.messages[0].content = [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${context.mimeType || 'image/jpeg'};base64,${base64Data}`
            }
          }
        ];
      }

      const response = await this.postChatCompletion(payload);
      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      logger.error('OpenRouter API error:', error.response?.data || error.message);
      throw new ApiError(503, `OpenRouter service error: ${error.message}`);
    }
  }
}


// ============================================================================
// AI SERVICE WITH FALLBACK
// ============================================================================

export class AIService extends BaseService {
  private providers: AIProvider[] = [];
  private maxRetries = 3;
  private baseRetryDelay = 1000;
  private maxRetryDelay = 10000;

  constructor() {
    super();
    // 1. Primary: Ollama
    this.providers.push(new OllamaProvider());

    // 2. Secondary: Ollama Backup
    this.providers.push(new OllamaBackupProvider());

    // 3. Tertiary: Gemini (If key exists)
    if (process.env.GEMINI_API_KEY) {
      this.providers.push(new GeminiProvider(process.env.GEMINI_API_KEY));
      logger.info('✅ Gemini AI fallback provider initialized');
    }

    // 4. Quaternary: OpenAI (If key exists)
    if (process.env.OPENAI_API_KEY) {
      this.providers.push(new OpenAIProvider(process.env.OPENAI_API_KEY));
      logger.info('✅ OpenAI fallback provider initialized');
    }

    // 5. Quinary: OpenRouter (If key exists)
    if (process.env.OPENROUTER_API_KEY) {
      this.providers.push(new OpenRouterProvider(process.env.OPENROUTER_API_KEY));
      logger.info('✅ OpenRouter fallback provider initialized');
    }
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^(attempt-1)
    const exponentialDelay = this.baseRetryDelay * Math.pow(2, attempt - 1);
    // Add jitter (random 0-30%) to prevent thundering herd
    const jitter = exponentialDelay * 0.3 * Math.random();
    const delay = Math.min(exponentialDelay + jitter, this.maxRetryDelay);
    return Math.round(delay);
  }

  /**
   * Generate text with automatic failover and exponential backoff
   */
  async generateText(prompt: string, context: any = {}): Promise<{
    text: string;
    provider: string;
    fallbackUsed: boolean;
    processingTime: number;
    retries: number;
  }> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    let totalRetries = 0;
    let finalPrompt = prompt;

    // RAG INJECTION LOGIC
    if (context.injectRAG && context.userId) {
      try {
        const { vectorService } = await import('./vector.service');
        const memories = await vectorService.queryMemory(context.userId, prompt, context.ragLimit || 5, context.ragModule);

        if (memories && memories.length > 0) {
          const memoryContext = memories.map((m: any) => `- [Past ${m.sourceModule}]: ${m.content}`).join('\n');
          finalPrompt = `You have access to the user's historical health data:\n\n<Memory>\n${memoryContext}\n</Memory>\n\nUse this context to personalize your answer.\n\n---\nREQUEST:\n${prompt}`;
          logger.info(`🧠 Injected ${memories.length} memories for user ${context.userId}`);
        }
      } catch (ragError) {
        logger.error('RAG injection failed:', ragError);
      }
    }

    // Iterate through providers (Ollama -> OllamaBackup -> Gemini)
    for (let pIndex = 0; pIndex < this.providers.length; pIndex++) {
      const provider = this.providers[pIndex];
      const isFallback = pIndex > 0;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          // Quick availability check
          const isAvailable = await provider.isAvailable();
          if (!isAvailable) throw new Error(`${provider.name} not available`);

          const text = await provider.generateText(finalPrompt, context);

          return {
            text,
            provider: provider.name,
            fallbackUsed: isFallback,
            processingTime: Date.now() - startTime,
            retries: totalRetries
          };
        } catch (error: any) {
          lastError = error;
          totalRetries++;

          const isLastProviderAttempt = attempt === this.maxRetries;
          const isLastProviderOverall = pIndex === this.providers.length - 1;

          logger.warn(`⚠️ AI Provider ${provider.name} attempt ${attempt} failed: ${error.message}`);

          if (!isLastProviderAttempt) {
            await this.delay(this.calculateRetryDelay(attempt));
          }
        }
      }

      if (pIndex < this.providers.length - 1) {
        logger.info(`Switching to fallback provider: ${this.providers[pIndex + 1].name}`);
      }
    }

    throw new ApiError(503, `All AI providers (${this.providers.map(p => p.name).join(', ')}) failed. Last error: ${lastError?.message}`);
  }

  /**
   * Diagnostic: Get list of available models from Ollama to troubleshoot connectivity
   */
  async getOllamaModels(): Promise<string[]> {
    try {
      const baseUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
      const response = await axios.get(`${baseUrl}/api/models`, {
        timeout: 5000,
        validateStatus: (status) => status === 200
      });

      const models = response.data?.models || [];
      return models.map((m: any) => m.name);
    } catch (error: any) {
      logger.error('Failed to fetch Ollama models:', error.message);
      return [];
    }
  }

  /**
   * Diagnostic: Overall AI Health Check
   */
  async checkHealth(): Promise<any> {
    const health: any = {
      providers: [],
      ollamaModels: await this.getOllamaModels(),
      env: {
        OLLAMA_URL: process.env.OLLAMA_URL,
        OLLAMA_MODEL: process.env.OLLAMA_MODEL,
        HAS_GEMINI: !!process.env.GEMINI_API_KEY,
        HAS_OPENAI: !!process.env.OPENAI_API_KEY
      }
    };

    for (const provider of this.providers) {
      health.providers.push({
        name: provider.name,
        isAvailable: await provider.isAvailable()
      });
    }

    return health;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a numerical embedding vector for a given text using Ollama
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const baseUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
      // User explicitly pulled nomic-embed-text for fast semantic embeddings
      const model = 'nomic-embed-text';

      const response = await axios.post(
        `${baseUrl}/api/embeddings`,
        {
          model: model,
          prompt: text
        },
        { timeout: 30000, validateStatus: (status) => status === 200 }
      );

      return response.data.embedding || [];
    } catch (error) {
      logger.error('Error generating local Ollama embedding:', error);
      return [];
    }
  }

  /**
   * Generate a smart title for a conversation based on the user's first message
   */
  async generateConversationTitle(message: string): Promise<string> {
    const prompt = `Generate a very short, concise title (max 5 words) for a health conversation starting with this message: "${message}". 
    Do NOT use quotes in the title. Return ONLY the title text.`;

    try {
      const { text } = await this.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 50
      });

      // Clean up the response (remove quotes, etc.)
      return text.replace(/["']/g, '').trim().substring(0, 50) || 'New Conversation';
    } catch (error) {
      logger.error('Failed to generate smart title:', error);
      return 'New Conversation';
    }
  }

  /**
   * Generate nutrition recommendations
   */
  async generateNutritionRecommendations(context: {
    goals: string[];
    dietaryRestrictions: string[];
    recentMeals: any[];
    calorieTarget: number;
    mealType: string;
  }, aiOptions?: any): Promise<any[]> {
    const prompt = `As an expert AI Nutritionist, suggest 3-4 delicious meal options for ${context.mealType}.
    
User Context:
- Health Goals: ${context.goals.join(', ')}
- Dietary Restrictions: ${context.dietaryRestrictions.join(', ') || 'None'}
- Target Calories for this meal: ~${context.calorieTarget} kcal

Provide a JSON array of objects. EACH object MUST follow this schema exactly:
{
  "name": "Short Appetizing Meal Name",
  "description": "Very brief appetizing description",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "ingredients": ["item 1", "item 2"],
  "recipeSteps": ["step 1", "step 2"],
  "preparationTime": number,
  "aiReasoning": "Specifically why this helps their goal"
}`;

    try {
      const { text } = await this.generateText(prompt, {
        temperature: 0.6,
        maxTokens: 1500,
        format: 'json',
        ...aiOptions
      });
      const recommendations = this.parseJSONResponse(text);
      return Array.isArray(recommendations) ? recommendations : [];
    } catch (error) {
      logger.error('Failed to generate nutrition recommendations:', error);
      return [];
    }
  }

  /**
   * Generate nutrition suggestions from raw user input
   */
  async generateNutritionSuggestionsFromInput(input: string, userContext?: any): Promise<any[]> {
    const cacheKey = `nutrition:${input.toLowerCase().trim()}:${userContext?.nutrition?.dietType || 'none'}`;

    try {
      const cached = await cacheService.get<any[]>(cacheKey);
      if (cached) {
        logger.info('🚀 NUTRITION CACHE HIT:', cacheKey);
        return cached;
      }
    } catch (err) {
      logger.error('Cache read error:', err);
    }

    // NOTE: recipeSteps are NOT requested here - they are lazy-loaded via /recipe-details
    // to keep the initial response small and fast.
    const prompt = `You are a nutritionist. Suggest 3 meal options for: "${input}".
    
    ${userContext ? `User Profile: Diet=${userContext.nutrition?.dietType || 'General'}, Goals=${userContext.goals?.primaryGoal || 'Wellness'}, Restrictions=${userContext.medicalConditions?.join(', ') || 'None'}` : ''}

    CRITICAL: Your response MUST be a raw JSON array starting with [ and ending with ]. Do NOT wrap it in an object. Do NOT add any text before or after.
    Return exactly 3 objects in this format:
    [{"name":"Meal Name","description":"Short appetizing description","calories":350,"protein":20,"carbs":40,"fats":10,"preparationTime":25,"ingredients":["ingredient 1","ingredient 2","ingredient 3"],"aiReasoning":"Why this fits their goal"}]`;

    try {
      logger.info('🍽️ GENERATING NUTRITION SUGGESTIONS (AI)...', { input });
      const { text } = await this.generateText(prompt, {
        temperature: 0.5,
        maxTokens: 2000,
        format: 'json'
      });

      logger.info('🍽️ RAW AI suggestions text:', { length: text.length, preview: text.substring(0, 200) });

      const recommendations = this.parseJSONResponse(text);
      // Handle AI returning a single object instead of an array
      let results: any[] = [];
      if (Array.isArray(recommendations)) {
        results = recommendations;
      } else if (recommendations && typeof recommendations === 'object' && recommendations.name) {
        // AI returned a single meal object instead of an array
        results = [recommendations];
      }

      if (results.length > 0) {
        await cacheService.set(cacheKey, results, 86400); // Cache for 24h
      }

      return results;
    } catch (error) {
      logger.error('Failed to generate nutrition suggestions from input:', error);
      return [];
    }
  }

  /**
   * Generate full recipe details for a specific meal
   */
  async generateRecipeDetails(mealName: string, description: string): Promise<{ ingredients: string[], recipeSteps: string[] }> {
    const prompt = `As an expert AI Nutritionist, provide the full recipe for the dish: "${mealName}".
    Context: ${description}
    
    You MUST provide a JSON object with this EXACT schema:
    {
      "ingredients": ["1 cup ingredient name", "2 tbsp item name", ...],
      "recipeSteps": ["Step 1 description", "Step 2 description", ...]
    }
    
    Important: 
    1. Ingredients must include measurements if possible.
    2. recipeSteps must be a flat array of strings.
    3. Return ONLY the JSON object. No conversational text.`;

    try {
      const { text } = await this.generateText(prompt, {
        temperature: 0.3, // Lower temperature for more consistent JSON
        maxTokens: 1500,
        format: 'json'
      });
      const details = this.parseJSONResponse(text);
      return {
        ingredients: Array.isArray(details?.ingredients) ? details.ingredients : [],
        recipeSteps: Array.isArray(details?.recipeSteps) ? details.recipeSteps : []
      };
    } catch (error) {
      logger.error('Failed to generate recipe details:', error);
      return { ingredients: [], recipeSteps: [] };
    }
  }

  /**
   * Estimate calories for a meal
   */
  async estimateMealCalories(mealName: string, items: string[]): Promise<number> {
    const prompt = `As an expert AI Nutritionist, estimate the total calories for a single serving of this meal:
Meal Name: ${mealName}
Items/Ingredients: ${items?.join(', ') || 'None'}

Return ONLY a JSON object with this exact schema:
{ "calories": number }`;

    try {
      const { text } = await this.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 50
      });
      const match = text.match(/\d+/);
      if (match) {
        return parseInt(match[0], 10);
      }
      return 0;
    } catch (error) {
      logger.error('Failed to estimate calories:', error);
      return 0;
    }
  }

  /**
   * Segregate known/unknown calories into detailed macros using AI
   */
  async segregateFoodMacros(foodName: string, quantity: number, unit: string, knownCalories?: number): Promise<{ calories: number; protein: number; carbs: number; fats: number; fiber: number }> {
    const hint = knownCalories ? `The user logged this at exactly ${knownCalories} calories total. Distribute these calories accurately into Protein (4 kcal/g), Carbs (4 kcal/g), and Fats (9 kcal/g).` : `Estimate the total calories.`;

    const prompt = `As an expert AI Nutritionist, analyze the macros for:
Item: ${foodName}
Quantity: ${quantity} ${unit}
${hint}

Return ONLY a pure JSON object (no markdown, no extra text) with this exact schema, using numerical grams (g) for macros:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "fiber": number
}`;

    try {
      const { text } = await this.generateText(prompt, {
        temperature: 0.1, // High consistency
        maxTokens: 200,  // Macro JSON: {"calories":0,"protein":0,"carbs":0,"fats":0,"fiber":0}
        format: 'json'
      });
      const parsed = this.parseJSONResponse(text);

      if (parsed) {
        return {
          calories: knownCalories || Number(parsed.calories) || 0,
          protein: Number(parsed.protein) || 0,
          carbs: Number(parsed.carbs) || 0,
          fats: Number(parsed.fats) || 0,
          fiber: Number(parsed.fiber) || 0
        };
      }

      throw new Error('Failed to parse AI macro object');
    } catch (error) {
      logger.error('Failed to segregate food macros with AI:', error);
      // Fallback zero state
      return { calories: knownCalories || 100, protein: 0, carbs: 0, fats: 0, fiber: 0 };
    }
  }

  /**
   * Generate workout recommendations
   */
  async generateWorkoutRecommendations(context: {
    fitnessLevel: string;
    availableTime: number;
    goals: string[];
    equipment: string[];
    recentWorkouts: any[];
    type?: string;
    isDaily?: boolean;
  }, aiOptions?: any): Promise<any[]> {
    const cacheKey = `workout:${context.fitnessLevel}:${context.availableTime}:${context.type || 'Any'}:${context.goals.join(',')}`;

    try {
      const cached = await cacheService.get<any[]>(cacheKey);
      if (cached) {
        logger.info('🚀 WORKOUT CACHE HIT:', cacheKey);
        return cached;
      }
    } catch (err) {
      logger.error('Cache read error:', err);
    }

    const prompt = `As a world-class fitness expert, provide exactly 2 diverse workout options.
    
USER PROFILE:
- Level: ${context.fitnessLevel}
- Available: ${context.availableTime} mins
- Goals: ${context.goals.join(', ')}
- Equipment: ${context.equipment.join(', ') || 'None'}
- Focus: ${context.type || 'Any'}
- Recent: ${context.recentWorkouts.map(w => w.type).join(', ') || 'None'}

INSTRUCTIONS:
1. STRICTLY follow Focus: ${context.type || 'Any'}.
2. Scale exercises to fit ${context.availableTime} mins.
3. Return ONLY a JSON array of objects.

JSON Schema:
[{
  "name": "Workout name",
  "type": "${context.type?.toLowerCase() || 'cardio'}",
  "duration": ${context.availableTime},
  "intensity": "low|moderate|high",
  "exercises": [{"name": "...", "sets": number, "reps": number, "tips": "short"}],
  "estimatedCaloriesBurn": number,
  "aiReasoning": "Why this matches"
}]`;

    try {
      logger.info('💪 GENERATING WORKOUT SUGGESTIONS (AI)...', { type: context.type });
      const { text } = await this.generateText(prompt, {
        temperature: 0.5,
        maxTokens: 800,
        format: 'json',
        ...aiOptions
      });

      const recommendations = this.parseJSONResponse(text);
      const results = Array.isArray(recommendations) ? recommendations : [];

      if (results.length > 0) {
        await cacheService.set(cacheKey, results, 86400); // 24h
      }

      return results;
    } catch (error) {
      logger.error('Failed to generate workout recommendations:', error);
      return [];
    }
  }

  /**
   * Generate a custom workout based on specific user request
   */
  async generateCustomWorkout(userRequest: string, profile: any): Promise<any> {
    const prompt = `As a personalized fitness trainer, create a specific workout based on this request: "${userRequest}"
    
USER CONTEXT:
- Fitness Level: ${profile?.fitness?.fitnessLevel || 'intermediate'}
- Equipment Access: ${profile?.fitness?.equipmentAccess?.join(', ') || 'none'}
- Limitations: ${profile?.fitness?.limitations?.injuries?.join(', ') || 'none'}

Provide a single JSON object (NOT an array) with this schema:
{
  "name": "Creative workout name",
  "type": "cardio|strength|flexibility|hiit",
  "duration": number,
  "intensity": "low|moderate|high",
  "exercises": [{"name": "...", "sets": number, "reps": number}],
  "estimatedCaloriesBurn": number,
  "aiReasoning": "How this fulfills their specific request safely"
}`;

    try {
      const { text } = await this.generateText(prompt, { maxTokens: 2048, format: 'json' });
      return this.parseJSONResponse(text);
    } catch (error) {
      logger.error('Failed to generate custom workout:', error);
      return null;
    }
  }

  /**
   * Analyze mental health check-in
   */
  async analyzeMentalHealth(checkIn: {
    mood: string;
    moodScore: number;
    stressLevel: number;
    anxietyLevel: number;
    notes?: string;
  }, aiOptions?: any): Promise<{
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    recommendations: string[];
    riskFlags: string[];
  }> {
    const prompt = `As a Clinical Mental Health Professional, analyze this psychological assessment and provide evidence-based insights.

CLINICAL ASSESSMENT DATA:
- Mood State: ${checkIn.mood} (Score: ${checkIn.moodScore}/10)
- Stress Level: ${checkIn.stressLevel}/10
- Anxiety Level: ${checkIn.anxietyLevel}/10
- Clinical Notes: ${checkIn.notes || 'No additional notes provided'}

PROFESSIONAL ANALYSIS REQUIREMENTS:
Provide a structured clinical assessment following this EXACT JSON format:
{
  "summary": "Brief clinical summary of current psychological state",
  "sentiment": "positive|neutral|negative",
  "recommendations": ["Evidence-based intervention 1", "Clinical strategy 2"],
  "riskFlags": ["Clinical concerns or 'No acute risk indicators identified'"]
}

CRITICAL: Return ONLY the JSON object. Do not include markdown, explanation, or any extra text.

CLINICAL GUIDELINES:
- Use professional, non-stigmatizing language
- Focus on observable behaviors and evidence-based patterns
- Include specific, actionable recommendations
- Identify any potential risk factors requiring professional attention
- Maintain appropriate clinical boundaries`;

    try {
      const { text } = await this.generateText(prompt, {
        temperature: 0.4,
        maxTokens: 1200,
        format: 'json',
        ...aiOptions
      });

      const parsed = this.parseJSONResponse(text);
      return parsed && typeof parsed === 'object'
        ? {
            summary: String(parsed.summary || 'Keep tracking your mood daily.'),
            sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : ['Practice self-care', 'Connect with loved ones'],
            riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags.map(String) : []
          }
        : {
            summary: 'Keep tracking your mood daily.',
            sentiment: 'neutral',
            recommendations: ['Practice self-care', 'Connect with loved ones'],
            riskFlags: []
          };
    } catch (error) {
      logger.error('Failed to analyze mental health:', error);
      return {
        summary: 'Continue monitoring your psychological well-being through regular check-ins.',
        sentiment: 'neutral',
        recommendations: ['Maintain consistent self-care practices', 'Consider professional consultation if symptoms persist'],
        riskFlags: []
      };
    }
  }

  /**
   * Generate cycle predictions
   */
  async generateCyclePredictions(cycleHistory: any[]): Promise<{
    nextPeriodDate: Date;
    ovulationDate: Date;
    fertileWindow: { start: Date; end: Date };
    confidence: number;
  }> {
    const prompt = `Based on this cycle history, predict next period and ovulation:

${JSON.stringify(cycleHistory.slice(-6), null, 2)}

Provide JSON response:
{
  "nextPeriodDate": "YYYY-MM-DD",
  "ovulationDate": "YYYY-MM-DD",
  "fertileWindow": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "confidence": 0.85
}`;

    try {
      const { text } = await this.generateText(prompt, { temperature: 0.3, format: 'json' });
      const prediction = this.parseJSONResponse(text);

      return {
        nextPeriodDate: new Date(prediction.nextPeriodDate),
        ovulationDate: new Date(prediction.ovulationDate),
        fertileWindow: {
          start: new Date(prediction.fertileWindow.start),
          end: new Date(prediction.fertileWindow.end)
        },
        confidence: prediction.confidence
      };
    } catch (error) {
      logger.error('Failed to generate cycle predictions:', error);
      // Return basic prediction based on average cycle length
      const lastCycle = cycleHistory[cycleHistory.length - 1];
      const avgCycleLength = 28;
      const nextPeriod = new Date(lastCycle.cycleStartDate);
      nextPeriod.setDate(nextPeriod.getDate() + avgCycleLength);

      return {
        nextPeriodDate: nextPeriod,
        ovulationDate: new Date(nextPeriod.getTime() - 14 * 24 * 60 * 60 * 1000),
        fertileWindow: {
          start: new Date(nextPeriod.getTime() - 16 * 24 * 60 * 60 * 1000),
          end: new Date(nextPeriod.getTime() - 12 * 24 * 60 * 60 * 1000)
        },
        confidence: 0.6
      };
    }
  }

  /**
   * Generate chat response with context
   */
  async generateChatResponse(params: {
    message: string;
    conversationHistory: any[];
    userContext: any;
    focusArea?: string;
    aiOptions?: any;
  }): Promise<{
    content: string;
    sources: any[];
    suggestedActions: any[];
    insights: any;
    fallbackUsed?: boolean;
  }> {
    logger.info('=== generateChatResponse DEBUG ===');
    logger.info(`Message: ${params.message}`);
    logger.info(`Focus Area: ${params.focusArea}`);
    logger.info(`User Context: ${JSON.stringify(params.userContext)}`);

    const prompt = `You are a direct and concise Health Assistant. Your goal is to provide immediate, actionable answers to health and wellness questions.

    CORE RULES:
    - BREVITY IS MANDATORY: Answer the user's question directly in the shortest possible way (maximum 2-3 short paragraphs).
    - NO INTRODUCTIONS: Do NOT say "I am your assistant", "As a health analyst", or "Evidence shows". Start answering the question immediately.
    - NO DISCLAIMERS: Skip standard clinical disclaimers or role explanations unless the user is in immediate acute danger.
    - NO JARGON: Avoid heavy clinical terminology like "neuroendocrine mechanisms" or "root physiological markers" unless specifically asked.
    - NO STRUCTURED HEADINGS: Respond in simple, natural paragraphs. Do NOT use numbered lists or bold titles.

    DOMAIN RESTRICTION:
    - Only answer health, wellness, fitness, nutrition, or mental health questions. For other topics, say: "I am a health assistant and cannot answer that."

    USER PROFILE:
    - Primary Goals: ${params.userContext?.goals?.primaryGoal || 'General wellness'}
    - Activity: ${params.userContext?.activityLevel || 'moderate'}

    CLINICAL DATA SNAPSHOT:
    ${JSON.stringify(params.userContext?.healthSnapshot || params.userContext, null, 2)}

    PATIENT QUERY: "${params.message}"`;

    try {
      logger.info('Calling generateText (Chat Mode)...');

      // FORCED HARDENING: Ensure 'format' is NOT passed to providers for chat
      const chatContext = {
        ...params.aiOptions,
        temperature: 0.7,
        maxTokens: 1000,
        format: undefined // STRICTLY FORBID JSON FORMATTING
      };

      const { text, fallbackUsed } = await this.generateText(prompt, chatContext);

      // POST-PROCESSING: Sanitize the response to remove accidental JSON characters
      let sanitizedText = text.trim();

      // If AI still outputs {} or [], strip them
      if (sanitizedText === '{}' || sanitizedText === '[]') {
        sanitizedText = "I'm here to provide professional health guidance. Could you please rephrase your concern so I can give you a more detailed analysis?";
      } else {
        // Remove accidental leading/trailing braces that some models append
        sanitizedText = sanitizedText.replace(/^[\{\[\s]+|[\}\]\s]+$/g, '');
      }

      logger.info('SANITIZED AI RESPONSE:', sanitizedText);
      logger.info('generateText successful');
      logger.info(`Response length: ${text.length}`);
      logger.info(`Fallback used: ${fallbackUsed}`);

      logger.info('Extracting suggested actions...');
      const suggestedActions = this.extractSuggestedActions(text);
      logger.info(`Suggested actions count: ${suggestedActions.length}`);

      const response = {
        content: sanitizedText,
        sources: [{ type: 'general', reference: 'ai-analysis', confidence: 0.9 }],
        suggestedActions,
        insights: {
          patterns: [],
          recommendations: []
        },
        fallbackUsed
      };

      logger.info('generateChatResponse completed successfully');
      return response;
    } catch (error) {
      logger.error('Failed to generate chat response:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Error details:', {
        message: errorMessage,
        stack: errorStack
      });
      return {
        content: "I'm here to provide professional health guidance and support your wellness journey. Please share your specific health questions or concerns, and I'll offer evidence-based recommendations tailored to your profile.",
        sources: [],
        suggestedActions: [],
        insights: {
          patterns: [],
          recommendations: []
        },
        fallbackUsed: true
      };
    }
  }

  /**
   * Generate specialized Hormone insights
   */
  async generateHormoneInsights(context: {
    phase: string;
    cycleDay: number;
    avgCycleLength: number;
    avgPeriodLength: number;
    recentSymptoms: string[];
    hormoneIssues: string[];
  }): Promise<{
    phaseDescription: string;
    recommendedActivities: string[];
    nutritionTips: string[];
    exerciseRecommendations: string[];
    moodExpectations: string;
    aiAlert?: string;
  }> {
    const prompt = `As a Board-Certified Endocrinology Consultant, provide clinical guidance based on hormonal cycle analysis.

CLINICAL ENDOCRINE PROFILE:
- Current Cycle Phase: ${context.phase} (Cycle Day ${context.cycleDay})
- Menstrual History: Average cycle length ${context.avgCycleLength} days, average period ${context.avgPeriodLength} days
- Reported Symptoms: ${context.recentSymptoms.join(', ') || 'No reported symptoms'}
- Clinical History: ${context.hormoneIssues.join(', ') || 'No documented endocrine concerns'}

PROFESSIONAL CLINICAL GUIDANCE REQUIREMENTS:
Provide structured clinical assessment following this exact schema:
{
  "phaseDescription": "Concise clinical explanation of current endocrine state (max 2 sentences)",
  "recommendedActivities": ["Evidence-based activity recommendation 1", "Activity 2"],
  "nutritionTips": ["Specific nutritional intervention for this phase"],
  "exerciseRecommendations": ["Phase-appropriate exercise guidance"],
  "moodExpectations": "Expected neurochemical impact on emotional state",
  "aiAlert": "Optional clinical alert if symptoms warrant medical attention"
}

CLINICAL STANDARDS:
- Use precise medical terminology appropriately
- Base recommendations on established endocrine principles
- Include specific, actionable guidance
- Maintain professional clinical boundaries
- Reference physiological mechanisms where relevant`;

    try {
      const { text } = await this.generateText(prompt, {
        temperature: 0.5,
        maxTokens: 1000,
        format: 'json'
      });
      const insights = this.parseJSONResponse(text);

      // Evidence-based fallback if AI analysis fails
      const fallback = {
        phaseDescription: `You are currently in the ${context.phase} phase of your menstrual cycle, characterized by specific hormonal fluctuations.`,
        recommendedActivities: ["Maintain regular physical activity", "Prioritize adequate sleep hygiene"],
        nutritionTips: ["Focus on nutrient-dense whole foods", "Ensure adequate hydration"],
        exerciseRecommendations: ["Engage in moderate-intensity activities appropriate for your energy level"],
        moodExpectations: "Hormonal variations during this phase may influence emotional well-being and energy levels."
      };

      return {
        phaseDescription: insights?.phaseDescription || fallback.phaseDescription,
        recommendedActivities: Array.isArray(insights?.recommendedActivities) ? insights.recommendedActivities : fallback.recommendedActivities,
        nutritionTips: Array.isArray(insights?.nutritionTips) ? insights.nutritionTips : fallback.nutritionTips,
        exerciseRecommendations: Array.isArray(insights?.exerciseRecommendations) ? insights.exerciseRecommendations : fallback.exerciseRecommendations,
        moodExpectations: insights?.moodExpectations || fallback.moodExpectations,
        aiAlert: insights?.aiAlert
      };
    } catch (error) {
      logger.error('Failed to generate hormone insights:', error);
      return {
        phaseDescription: "Analyzing your cycle data for better insights.",
        recommendedActivities: ["Maintain your current routine"],
        nutritionTips: ["Stay hydrated"],
        exerciseRecommendations: ["Listen to your body's energy"],
        moodExpectations: "Stable."
      };
    }
  }

  /**
   * Correlate Hormonal state with Mental Health
   */
  async generateHormonePersonalityCorrelation(context: {
    phase: string;
    mood: string;
    stressLevel: number;
    cycleDay: number;
  }): Promise<string> {
    const prompt = `As a Clinical Psychoneuroendocrinology Specialist, provide evidence-based correlation between hormonal status and psychological presentation.

CLINICAL ASSESSMENT:
- Current Cycle Phase: ${context.phase} (Cycle Day ${context.cycleDay})
- Reported Mood State: ${context.mood}
- Stress Level Assessment: ${context.stressLevel}/10

PROFESSIONAL REQUIREMENTS:
Provide a concise clinical explanation (1-2 sentences) of the neuroendocrine mechanisms underlying the observed psychological state. Reference specific hormonal influences and their documented effects on mood and stress response.

CLINICAL STANDARDS:
- Use precise neuroendocrine terminology
- Reference established physiological mechanisms
- Maintain professional clinical perspective
- Focus on evidence-based correlations`;

    try {
      const { text } = await this.generateText(prompt, { temperature: 0.4, maxTokens: 150 });
      return text.trim();
    } catch (error) {
      logger.error('Failed to generate hormone-mental correlation:', error);
      return "Current hormonal fluctuations may be influencing your psychological well-being and stress response patterns.";
    }
  }

  /**
   * Deep Analysis of Journal Entry
   */
  async analyzeJournalEntryDeep(content: string): Promise<{
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    patterns: string[];
    suggestions: string[];
    cognitiveDistortions?: string[];
  }> {
    const prompt = `As a Clinical Psychologist specializing in cognitive behavioral analysis, conduct a professional assessment of this journal entry.

CLINICAL TEXT ANALYSIS:
"${content}"

PROFESSIONAL ASSESSMENT REQUIREMENTS:
Provide structured clinical analysis following this format:
{
  "summary": "Concise clinical summary of psychological content",
  "sentiment": "positive|neutral|negative",
  "patterns": ["Identified psychological pattern 1", "Pattern 2"],
  "cognitiveDistortions": ["Specific cognitive distortions identified using CBT terminology"],
  "suggestions": ["Evidence-based therapeutic intervention 1", "Clinical strategy 2"]
}

CLINICAL STANDARDS:
- Use established psychological terminology
- Apply cognitive behavioral therapy principles
- Identify specific cognitive distortions using standard CBT classifications
- Provide evidence-based therapeutic recommendations
- Maintain professional clinical boundaries
- Focus on observable patterns and evidence-based interventions`;

    try {
      const { text } = await this.generateText(prompt, {
        temperature: 0.5,
        maxTokens: 500,
        format: 'json'
      });
      const insights = this.parseJSONResponse(text);
      return {
        summary: insights?.summary || "Entry recorded.",
        sentiment: insights?.sentiment || "neutral",
        patterns: Array.isArray(insights?.patterns) ? insights.patterns : [],
        suggestions: Array.isArray(insights?.suggestions) ? insights.suggestions : ["Keep journaling to track patterns."],
        cognitiveDistortions: Array.isArray(insights?.cognitiveDistortions) ? insights.cognitiveDistortions : []
      };
    } catch (error) {
      logger.error('Failed to analyze journal entry deep:', error);
      return {
        summary: "Journal entry documented for psychological tracking.",
        sentiment: "neutral",
        patterns: [],
        suggestions: ["Continue regular journaling to monitor psychological patterns", "Consider discussing recurring themes with a mental health professional"],
        cognitiveDistortions: []
      };
    }
  }

  /**
   * Generate Assessment Highlights (MCQ Interpretation)
   */
  async generateAssessmentInsights(context: {
    assessmentType: string;
    score: number;
    subScores?: any;
    responses: Array<{ question: string; answer: string; score: number }>;
    userContext?: string;
  }): Promise<{
    summary: string;
    detailedAnalysis: string;
    personalityTraits: string[];
    riskIndicators: string[];
    nextSteps: string[];
  }> {
    let prompt = `As a Senior Clinical Psychometric Specialist, provide a professional, evidence-based interpretation of this standardized psychological assessment.

ASSESSMENT PROTOCOL & CLINICAL DATA:
- Assessment Instrument: ${context.assessmentType.toUpperCase()}
- Primary Clinical Score: ${context.score}
- Granular Sub-Scales: ${JSON.stringify(context.subScores || 'N/A')}
- Raw Itemized Response Data: ${JSON.stringify(context.responses)}

PROFESSIONAL PSYCHOMETRIC ANALYSIS REQUIREMENTS:
Provide a structured clinical interpretation following this exact JSON format:
{
  "summary": "Concise clinical summary (1-2 sentences) of current psychological status",
  "detailedAnalysis": "Deep-dive clinical interpretation referencing specific scales and score thresholds",
  "personalityTraits": ["Key psychological traits or archetypes identified"],
  "riskIndicators": ["Specific clinical risk factors or 'No acute risk indicators identified'"],
  "nextSteps": ["Evidence-based clinical recommendation 1", "Therapeutic strategy 2"]
}

CRITICAL: Return ONLY the JSON object. Do not include markdown, explanation, or any extra text.

CLINICAL STANDARDS:
- Use established psychometric terminology.
- Apply evidence-based interpretation frameworks.
- For DASS-21, specifically correlate Depression, Anxiety, and Stress sub-scores.
- For MMPI-2, interpret the clinical scales if provided in the data.
- Maintain professional, objective, yet empathetic clinical boundaries.
- Provide highly specific, actionable clinical recommendations.

If you cannot safely interpret the data, return a JSON object with empty arrays and a compassionate summary.`;

    if (context.userContext) {
      prompt += `\n\nPERSONALIZATION CONTEXT:\n${context.userContext}`;
    }

    try {
      const { text } = await this.generateText(prompt, {
        temperature: 0.4,
        maxTokens: 800,
        format: 'json'
      });
      const insights = this.parseJSONResponse(text);
      return {
        summary: insights?.summary || "Assessment complete.",
        detailedAnalysis: insights?.detailedAnalysis || "We are analyzing your results for deeper patterns.",
        personalityTraits: Array.isArray(insights?.personalityTraits) ? insights.personalityTraits : [],
        riskIndicators: Array.isArray(insights?.riskIndicators) ? insights.riskIndicators : [],
        nextSteps: Array.isArray(insights?.nextSteps) ? insights.nextSteps : ["Continue tracking your mental wellness daily."]
      };
    } catch (error) {
      logger.error('Failed to generate assessment insights:', error);
      return {
        summary: "Psychological assessment completed and documented.",
        detailedAnalysis: "Results are being processed using evidence-based psychometric frameworks for comprehensive interpretation.",
        personalityTraits: [],
        riskIndicators: [],
        nextSteps: ["Continue regular psychological monitoring", "Consider professional consultation for detailed interpretation"]
      };
    }
  }

  /**
   * Discover correlations in user data
   */
  async discoverCorrelations(userData: {
    nutrition: any[];
    workouts: any[];
    mentalHealth: any[];
    sleep: any[];
  }): Promise<any[]> {
    const prompt = `Analyze this health data and find correlations:

Nutrition: ${JSON.stringify(userData.nutrition.slice(-14))}
Workouts: ${JSON.stringify(userData.workouts.slice(-14))}
Mental Health: ${JSON.stringify(userData.mentalHealth.slice(-14))}

Provide JSON array of correlations:
[{
  "factor1": "sleep quality",
  "factor2": "mood score",
  "correlation": 0.75,
  "strength": "strong",
  "direction": "positive",
  "description": "Better sleep correlates with improved mood",
  "confidence": 0.85
}]`;

    try {
      const { text } = await this.generateText(prompt, { temperature: 0.4, format: 'json' });
      const correlations = this.parseJSONResponse(text);
      return Array.isArray(correlations) ? correlations : [];
    } catch (error) {
      logger.error('Failed to discover correlations:', error);
      return [];
    }
  }

  // Helper methods

  private parseJSONResponse(text: string): any {
    if (!text) return null;

    try {
      const cleanedText = text.trim();

      // Extractor helper function
      const tryParse = (str: string) => {
        try { return JSON.parse(str); } catch (e) { return null; }
      };

      let parsed: any = null;

      // 1. First, try to see if it's already a valid JSON string
      if ((parsed = tryParse(cleanedText)) !== null) {
        // Proceed to normalization
      } else {
        // 2. Try to find JSON inside a markdown code block
        const backtickMatch = cleanedText.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
        if (backtickMatch && (parsed = tryParse(backtickMatch[1].trim())) !== null) {
          // Proceed
        } else {
          // 3. Fallback: try to extract the largest {...} or [...] block
          const firstCurly = cleanedText.indexOf('{');
          const lastCurly = cleanedText.lastIndexOf('}');

          const firstSquare = cleanedText.indexOf('[');
          const lastSquare = cleanedText.lastIndexOf(']');

          let objPayload = null;
          if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
            objPayload = tryParse(cleanedText.substring(firstCurly, lastCurly + 1));
          }

          let arrPayload = null;
          if (firstSquare !== -1 && lastSquare !== -1 && lastSquare > firstSquare) {
            arrPayload = tryParse(cleanedText.substring(firstSquare, lastSquare + 1));
          }

          // Use whichever parsed successfully. If both did, use the one that started earlier
          if (objPayload && arrPayload) {
            parsed = (firstCurly < firstSquare) ? objPayload : arrPayload;
          } else if (objPayload) {
            parsed = objPayload;
          } else if (arrPayload) {
            parsed = arrPayload;
          } else {
            throw new Error('Could not find any valid JSON object or array in the text');
          }
        }
      }

      // Normalization: If it's a wrapped object, extract the payload //
      // Only unwrap if the object has ONE key and that key is in our payload list
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        if (keys.length === 1) {
          const payloadKeys = ['suggestions', 'meals', 'options', 'recommendations', 'recipe', 'data', 'details', 'steps', 'mealOptions', 'results', 'foods', 'items', 'workouts', 'exercises', 'response', 'result', 'output'];
          if (payloadKeys.includes(keys[0])) {
            return parsed[keys[0]];
          }
        }
      }

      return parsed;
    } catch (error) {
      // 2b. Regex-based JSON extraction (if standard JSON.parse fails)
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (innerError) {
        // Continue to fallback
      }

      console.error('❌ JSON Parse Error:', (error as Error).message);

      // 3. BRUTE-FORCE FALLBACK: Manual keyword extraction (Walking Parser)
      // This is the "100% Reliability" layer
      const fallback = this.extractMacrosFromText(text);
      if (fallback && fallback.calories > 0) {
        console.log('✨ Brute-force macro extraction successful!');
        return fallback;
      }

      return null;
    }
  }

  /**
   * BRUTE-FORCE SCANNER (Walking Parser)
   * Manually sweeps text for keywords and related numbers
   */
  private extractMacrosFromText(text: string): { calories: number; protein: number; carbs: number; fats: number; fiber: number } | null {
    if (!text) return null;
    const lowerText = text.toLowerCase();

    const findValue = (keyword: string): number => {
      const regex = new RegExp(`${keyword}[:\\s]*(\\d+)`, 'i');
      const match = text.match(regex);
      return match ? parseInt(match[1], 10) : 0;
    };

    const calories = findValue('calories') || findValue('kcal') || findValue('cal');
    const protein = findValue('protein') || findValue('prot');
    const carbs = findValue('carbohydrates') || findValue('carbs') || findValue('carb');
    const fats = findValue('fats') || findValue('fat');
    const fiber = findValue('fiber') || findValue('fib');

    if (calories > 0) {
      return { calories, protein, carbs, fats, fiber };
    }
    return null;
  }

  private extractSuggestedActions(text: string): any[] {
    const actions: any[] = [];

    if (text.toLowerCase().includes('workout') || text.toLowerCase().includes('exercise')) {
      actions.push({ type: 'log-workout', label: 'Log Workout', payload: {} });
    }
    if (text.toLowerCase().includes('meal') || text.toLowerCase().includes('food') || text.toLowerCase().includes('eat')) {
      actions.push({ type: 'log-meal', label: 'Log Meal', payload: {} });
    }
    if (text.toLowerCase().includes('mood') || text.toLowerCase().includes('feeling')) {
      actions.push({ type: 'log-mood', label: 'Check In', payload: {} });
    }

    return actions;
  }
}

export const aiService = new AIService();
