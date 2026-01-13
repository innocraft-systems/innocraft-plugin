---
name: setup-gemini
description: Set up Google Gemini AI integration
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--basic | --multimodal | --live | --full]"
---

# Setup Gemini AI Integration

Set up Google Gemini API for text, multimodal, and real-time AI capabilities.

## Instructions

1. Check if the project has an existing package.json. If not, inform the user they need to initialize a project first.

2. Determine the integration scope:
   - If `--basic` flag: Set up text generation only
   - If `--multimodal` flag: Set up image/audio/video understanding
   - If `--live` flag: Set up real-time streaming (Live API)
   - If `--full` flag: Set up all capabilities
   - Otherwise: Ask the user which capabilities they need

3. Install required dependencies:
   ```bash
   npm install @google/generative-ai dotenv
   ```

   For Live API, also install:
   ```bash
   npm install ws
   ```

4. Create the directory structure:
   - `src/lib/gemini/client.ts` - Main Gemini client
   - `src/lib/gemini/types.ts` - TypeScript types
   - `src/lib/gemini/streaming.ts` - Streaming utilities (if --live or --full)

5. Create or update `.env.example` with required variables:
   ```
   # Gemini AI
   GOOGLE_API_KEY=your_gemini_api_key

   # Optional: OpenRouter (alternative provider)
   OPENROUTER_API_KEY=your_openrouter_key
   ```

6. Add `.env` to `.gitignore` if not already present.

7. Print next steps:
   - Get API key from Google AI Studio (aistudio.google.com)
   - Choose appropriate model for use case
   - Test with simple text generation

## Client Template

```typescript
import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';

interface GeminiConfig {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string;

  constructor(defaultModel: string = 'gemini-2.0-flash') {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    this.defaultModel = defaultModel;
  }

  // ========== TEXT GENERATION ==========

  async generate(prompt: string, config?: GeminiConfig): Promise<string> {
    const model = this.getModel(config?.model);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        maxOutputTokens: config?.maxOutputTokens ?? 2048,
        topP: config?.topP ?? 0.95,
        topK: config?.topK ?? 40,
      },
    });

    return result.response.text();
  }

  async *generateStream(prompt: string, config?: GeminiConfig): AsyncGenerator<string> {
    const model = this.getModel(config?.model);

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        maxOutputTokens: config?.maxOutputTokens ?? 2048,
      },
    });

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  }

  // ========== CHAT ==========

  createChat(config?: GeminiConfig) {
    const model = this.getModel(config?.model);
    return model.startChat({
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        maxOutputTokens: config?.maxOutputTokens ?? 2048,
      },
    });
  }

  // ========== MULTIMODAL ==========

  async analyzeImage(
    imageSource: string | Buffer,
    prompt: string,
    config?: GeminiConfig
  ): Promise<string> {
    const model = this.getModel(config?.model || 'gemini-2.0-flash');

    const imagePart = await this.createImagePart(imageSource);

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [imagePart, { text: prompt }],
      }],
    });

    return result.response.text();
  }

  async analyzeVideo(
    videoSource: string | Buffer,
    mimeType: string,
    prompt: string,
    config?: GeminiConfig
  ): Promise<string> {
    const model = this.getModel(config?.model || 'gemini-2.0-flash');

    let videoPart: Part;

    if (typeof videoSource === 'string') {
      // URL - use file API for large videos
      videoPart = {
        fileData: {
          fileUri: videoSource,
          mimeType,
        },
      };
    } else {
      // Buffer
      videoPart = {
        inlineData: {
          data: videoSource.toString('base64'),
          mimeType,
        },
      };
    }

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [videoPart, { text: prompt }],
      }],
    });

    return result.response.text();
  }

  // ========== IMAGE GENERATION (Nano Banana) ==========

  async generateImage(prompt: string, dimensions?: { width: number; height: number }): Promise<Buffer> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['image'],
        imageDimensions: dimensions || { width: 1024, height: 1024 },
      },
    });

    const imagePart = result.response.candidates?.[0]?.content?.parts?.find(
      p => p.inlineData
    );

    if (!imagePart?.inlineData) {
      throw new Error('No image generated');
    }

    return Buffer.from(imagePart.inlineData.data, 'base64');
  }

  // ========== FUNCTION CALLING ==========

  async generateWithTools(
    prompt: string,
    tools: Array<{
      name: string;
      description: string;
      parameters: object;
    }>,
    config?: GeminiConfig
  ) {
    const model = this.genAI.getGenerativeModel({
      model: config?.model || 'gemini-2.0-flash',
      tools: [{
        functionDeclarations: tools,
      }],
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = result.response;
    const functionCall = response.candidates?.[0]?.content?.parts?.find(
      p => p.functionCall
    );

    if (functionCall?.functionCall) {
      return {
        type: 'function_call' as const,
        name: functionCall.functionCall.name,
        args: functionCall.functionCall.args,
      };
    }

    return {
      type: 'text' as const,
      text: response.text(),
    };
  }

  // ========== JSON MODE ==========

  async generateJSON<T>(prompt: string, config?: GeminiConfig): Promise<T> {
    const model = this.getModel(config?.model);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config?.temperature ?? 0.3,
        maxOutputTokens: config?.maxOutputTokens ?? 4096,
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(result.response.text());
  }

  // ========== HELPERS ==========

  private getModel(modelId?: string): GenerativeModel {
    return this.genAI.getGenerativeModel({
      model: modelId || this.defaultModel,
    });
  }

  private async createImagePart(source: string | Buffer): Promise<Part> {
    if (typeof source === 'string') {
      if (source.startsWith('http')) {
        // URL - fetch and convert
        const response = await fetch(source);
        const buffer = await response.arrayBuffer();
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return {
          inlineData: {
            data: Buffer.from(buffer).toString('base64'),
            mimeType,
          },
        };
      } else {
        // File path
        const fs = await import('fs/promises');
        const buffer = await fs.readFile(source);
        const ext = source.split('.').pop()?.toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        return {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType,
          },
        };
      }
    } else {
      // Buffer
      return {
        inlineData: {
          data: source.toString('base64'),
          mimeType: 'image/jpeg',
        },
      };
    }
  }
}

export const gemini = new GeminiClient();
```

## Model Selection Guide

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| Chat, Q&A | `gemini-2.0-flash` | Fast, good quality |
| Long documents | `gemini-1.5-pro` | 2M context window |
| Complex reasoning | `gemini-2.5-pro` | Thinking capability |
| Image generation | `gemini-2.5-flash-image` | Nano Banana |
| Real-time voice | `gemini-2.0-flash-live` | Live API |
| Agents, tools | `gemini-2.0-flash` | Native function calling |

## Usage Examples

```typescript
import { gemini } from '@/lib/gemini/client';

// Basic generation
const text = await gemini.generate('Explain quantum computing');

// Streaming
for await (const chunk of gemini.generateStream('Write a story')) {
  process.stdout.write(chunk);
}

// Image analysis
const description = await gemini.analyzeImage(
  'https://example.com/image.jpg',
  'Describe this image in detail'
);

// Image generation
const imageBuffer = await gemini.generateImage(
  'A serene mountain landscape at sunset'
);

// JSON mode
const data = await gemini.generateJSON<{ items: string[] }>(
  'List 5 programming languages as JSON array'
);

// Function calling
const result = await gemini.generateWithTools(
  'What is the weather in Nairobi?',
  [{
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      }
    }
  }]
);
```

## Tips

- Get API key from aistudio.google.com (free tier available)
- gemini-2.0-flash is best for most use cases (fast, capable)
- Use gemini-1.5-pro for very long documents (2M tokens)
- Nano Banana (image gen) requires gemini-2.5-flash-image model
- Reference gemini-models, gemini-multimodal skills for detailed docs
