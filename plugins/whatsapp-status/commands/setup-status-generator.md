---
name: setup-status-generator
description: Set up AI-powered WhatsApp Status content generation
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--images | --videos | --both]"
---

# Setup WhatsApp Status Generator

Set up AI-powered content generation for WhatsApp Status using Gemini (Nano Banana).

## Instructions

1. Check if the project has an existing package.json. If not, inform the user they need to initialize a project first.

2. Determine the content type:
   - If `--images` flag: Set up image generation only
   - If `--videos` flag: Set up video generation only
   - If `--both` flag: Set up both image and video generation
   - Otherwise: Ask the user which content types they need

3. Install required dependencies:
   ```bash
   npm install @google/generative-ai dotenv sharp
   ```

   For video generation, also install:
   ```bash
   npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
   ```

4. Create the directory structure:
   - `src/lib/status/generator.ts` - Main generator class
   - `src/lib/status/templates.ts` - Prompt templates
   - `src/lib/status/types.ts` - TypeScript types
   - `src/lib/status/utils.ts` - Helper functions

5. Create or update `.env.example` with required variables:
   ```
   # Gemini AI (for Nano Banana)
   GOOGLE_API_KEY=your_gemini_api_key

   # Optional: WhatsApp Cloud API (for auto-posting)
   WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   ```

6. Add `.env` to `.gitignore` if not already present.

7. Create output directory for generated content:
   ```bash
   mkdir -p public/status-content
   ```

8. Print next steps:
   - Get Gemini API key from Google AI Studio
   - Test image generation with sample prompt
   - Optionally connect WhatsApp for auto-posting

## Generator Template

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

// Status dimensions
const STATUS_WIDTH = 1080;
const STATUS_HEIGHT = 1920;

interface StatusOptions {
  type: 'product' | 'promo' | 'announcement' | 'quote';
  title?: string;
  description?: string;
  price?: string;
  currency?: string;
  businessName?: string;
  style?: 'modern' | 'bold' | 'minimal' | 'vibrant';
}

export class StatusGenerator {
  private genAI: GoogleGenerativeAI;
  private outputDir: string;

  constructor(outputDir: string = './public/status-content') {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    this.outputDir = outputDir;
  }

  async generateImage(options: StatusOptions): Promise<string> {
    const prompt = this.buildPrompt(options);

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        responseModalities: ['image'],
        imageDimensions: {
          width: STATUS_WIDTH,
          height: STATUS_HEIGHT,
        },
      },
    });

    const imagePart = result.response.candidates?.[0]?.content?.parts?.find(
      p => p.inlineData
    );

    if (!imagePart?.inlineData) {
      throw new Error('No image generated');
    }

    // Save image
    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
    const filename = `status-${Date.now()}.png`;
    const filepath = path.join(this.outputDir, filename);

    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.writeFile(filepath, buffer);

    return filepath;
  }

  async generateProductShowcase(product: {
    name: string;
    price: number;
    currency?: string;
    description?: string;
    features?: string[];
    businessName?: string;
  }): Promise<string> {
    const prompt = `
      Create a professional WhatsApp Status image (1080x1920, portrait).

      Product Showcase for: ${product.name}
      Price: ${product.currency || 'KES'} ${product.price.toLocaleString()}
      ${product.description ? `Description: ${product.description}` : ''}
      ${product.features ? `Features: ${product.features.join(', ')}` : ''}
      ${product.businessName ? `Business: ${product.businessName}` : ''}

      Style requirements:
      - Clean, modern design with bold typography
      - Price prominently displayed
      - Professional product presentation
      - Eye-catching but not cluttered
      - Include subtle "Available Now" or "In Stock" badge
      - Kenya-appropriate aesthetic (warm colors, trustworthy feel)
    `;

    return this.generateWithPrompt(prompt);
  }

  async generatePromoBanner(promo: {
    headline: string;
    discount?: string;
    validUntil?: string;
    businessName?: string;
    ctaText?: string;
  }): Promise<string> {
    const prompt = `
      Create a WhatsApp Status promotional banner (1080x1920, portrait).

      Headline: ${promo.headline}
      ${promo.discount ? `Discount: ${promo.discount}` : ''}
      ${promo.validUntil ? `Valid Until: ${promo.validUntil}` : ''}
      ${promo.businessName ? `Business: ${promo.businessName}` : ''}
      ${promo.ctaText ? `Call to Action: ${promo.ctaText}` : 'Call to Action: Shop Now'}

      Style requirements:
      - Bold, attention-grabbing design
      - Discount/offer prominently displayed
      - Urgency indicators (limited time, etc.)
      - Professional but exciting
      - Clear call to action
    `;

    return this.generateWithPrompt(prompt);
  }

  async generatePriceList(items: Array<{
    name: string;
    price: number;
  }>, options: {
    title?: string;
    currency?: string;
    businessName?: string;
  } = {}): Promise<string> {
    const itemsList = items
      .map(i => `- ${i.name}: ${options.currency || 'KES'} ${i.price.toLocaleString()}`)
      .join('\n');

    const prompt = `
      Create a WhatsApp Status price list (1080x1920, portrait).

      ${options.title ? `Title: ${options.title}` : 'Title: Our Prices'}
      ${options.businessName ? `Business: ${options.businessName}` : ''}

      Items:
      ${itemsList}

      Style requirements:
      - Clean, easy-to-read layout
      - Prices clearly visible
      - Professional typography
      - Organized in a visually appealing way
      - Include M-Pesa badge or payment info if space allows
    `;

    return this.generateWithPrompt(prompt);
  }

  private async generateWithPrompt(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        responseModalities: ['image'],
        imageDimensions: {
          width: STATUS_WIDTH,
          height: STATUS_HEIGHT,
        },
      },
    });

    const imagePart = result.response.candidates?.[0]?.content?.parts?.find(
      p => p.inlineData
    );

    if (!imagePart?.inlineData) {
      throw new Error('No image generated');
    }

    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
    const filename = `status-${Date.now()}.png`;
    const filepath = path.join(this.outputDir, filename);

    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.writeFile(filepath, buffer);

    return filepath;
  }

  private buildPrompt(options: StatusOptions): string {
    const basePrompt = `Create a WhatsApp Status image (1080x1920 portrait) with ${options.style || 'modern'} style.`;

    switch (options.type) {
      case 'product':
        return `${basePrompt} Product showcase for "${options.title}". Price: ${options.currency || 'KES'} ${options.price}. ${options.description || ''}`;
      case 'promo':
        return `${basePrompt} Promotional banner: "${options.title}". ${options.description || ''}`;
      case 'announcement':
        return `${basePrompt} Business announcement: "${options.title}". ${options.description || ''}`;
      case 'quote':
        return `${basePrompt} Inspirational quote design: "${options.title}". ${options.description || ''}`;
      default:
        return basePrompt;
    }
  }
}

export const statusGenerator = new StatusGenerator();
```

## Usage Examples

```typescript
import { statusGenerator } from '@/lib/status/generator';

// Product showcase
const productImage = await statusGenerator.generateProductShowcase({
  name: 'Samsung Galaxy A54',
  price: 45000,
  currency: 'KES',
  description: 'Brand new, 1 year warranty',
  businessName: "Martin's Electronics"
});

// Promo banner
const promoImage = await statusGenerator.generatePromoBanner({
  headline: 'FLASH SALE - 30% OFF',
  discount: '30% off all phones',
  validUntil: 'Sunday midnight',
  businessName: "Martin's Electronics",
  ctaText: 'Visit us today!'
});

// Price list
const priceList = await statusGenerator.generatePriceList([
  { name: 'iPhone 15 Pro', price: 180000 },
  { name: 'Samsung S24', price: 150000 },
  { name: 'Pixel 8', price: 120000 },
], {
  title: 'Latest Phone Prices',
  businessName: "Martin's Electronics"
});
```

## Tips

- Nano Banana (gemini-2.5-flash-image) is fast and good for batch generation
- For text-heavy images, consider Nano Banana Pro (gemini-3-pro-image-preview)
- Status dimensions are always 1080x1920 (9:16 portrait)
- Kenya-specific: Include M-Pesa badges, KES formatting
- Reference status-images skill for detailed prompt engineering
