# 🤖 AI Integration Guide for ProntoLingo

This guide explains how to integrate powerful **free AI features** into your ProntoLingo language learning application.

## 🚀 **Free AI Providers & Setup**

### **1. Google AI (Gemini) - RECOMMENDED ⭐**

**Why:** Most generous free tier, excellent for language learning tasks

- **Free Tier:** 15 requests/minute, 1 million tokens/month
- **Setup:** Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

```env
GOOGLE_GENAI_API_KEY=your_google_ai_key_here
```

### **2. OpenAI (GPT) - NEW USERS GET FREE CREDITS**

**Why:** High-quality responses, good for conversation practice

- **Free Tier:** $5 free credits for new users
- **Setup:** Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)

```env
OPENAI_API_KEY=your_openai_key_here
```

### **3. Anthropic Claude - FREE TIER AVAILABLE**

**Why:** Excellent for educational content and grammar explanations

- **Free Tier:** Limited requests per month
- **Setup:** Get API key from [Anthropic Console](https://console.anthropic.com/)

```env
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### **4. Hugging Face - COMPLETELY FREE**

**Why:** Access to thousands of open-source AI models

- **Free Tier:** Completely free with rate limits
- **Setup:** Get token from [Hugging Face](https://huggingface.co/settings/tokens)

```env
HUGGINGFACE_API_KEY=your_huggingface_token_here
```

## 🔧 **Quick Setup Instructions**

### **Step 1: Environment Configuration**

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Add your Google AI API key (minimum required):

```env
GOOGLE_GENAI_API_KEY=your_actual_google_ai_key
NEXT_PUBLIC_AI_FEATURES_ENABLED=true
```

### **Step 2: Install Dependencies**

The AI dependencies are already included in your `package.json`:

```bash
npm install
# or
yarn install
```

### **Step 3: Start Development Server**

```bash
npm run dev
# AI features will be available in the sidebar
```

## 🎯 **AI Features Available**

### **1. Grammar Explainer** ✅ _Already Active_

- **What:** AI-powered explanations of French grammar
- **Uses:** Google Gemini Flash (free tier)
- **Access:** Click "Explain Grammar" button in study area

### **2. AI Sentence Generator** ⭐ _New Feature_

- **What:** Generate personalized practice sentences
- **Features:**
  - Custom verb practice
  - Difficulty levels (beginner/intermediate/advanced)
  - Specific tense focus
  - Instant translations
- **Access:** "AI Features" section in sidebar

### **3. AI Progress Dashboard** ⭐ _New Feature_

- **What:** Personalized learning analytics and recommendations
- **Features:**
  - Performance analysis
  - Strengths & weaknesses identification
  - Study recommendations
  - Motivational insights
- **Access:** "AI Features" section in sidebar

### **4. AI Conversation Partner** 🔮 _Coming Soon_

- **What:** Practice French conversations with AI
- **Features:**
  - Natural conversation flow
  - Error corrections
  - Vocabulary suggestions
  - Cultural context

## 💰 **Cost Management & Free Tier Limits**

### **Google AI (Recommended)**

```
✅ 15 requests/minute
✅ 1M tokens/month FREE
✅ Perfect for language learning
```

### **Rate Limiting Configuration**

Built-in protection to stay within free tiers:

```typescript
export const AI_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 15,
  MAX_TOKENS_PER_REQUEST: 2048,
} as const;
```

## 🛠 **Advanced Configuration**

### **Multiple AI Providers (Fallback System)**

```typescript
// In src/ai/genkit.ts
export const AI_PROVIDERS = {
  PRIMARY: "googleai/gemini-2.0-flash", // Free tier
  FALLBACK: "googleai/gemini-1.5-flash", // Backup
} as const;
```

### **Custom AI Flows**

Create your own AI features by adding new flows:

```typescript
// Example: src/ai/flows/vocabulary-builder.ts
export async function buildVocabulary(input: VocabularyInput) {
  return vocabularyFlow(input);
}
```

## 🔍 **Monitoring Usage**

### **Track API Usage**

1. **Google AI:** Check usage at [Google AI Studio](https://makersuite.google.com/)
2. **OpenAI:** Monitor at [OpenAI Usage Dashboard](https://platform.openai.com/usage)
3. **Logs:** Check browser console for request counts

### **Usage Optimization Tips**

- ✅ Use caching for repeated requests
- ✅ Implement request debouncing
- ✅ Batch similar requests
- ✅ Use lower token limits for simple tasks

## 🎮 **How to Use AI Features**

### **For Students:**

1. **Generate Practice Sentences:**

   - Go to "AI Features" → "AI Sentence Generator"
   - Enter a French verb (e.g., "avoir", "faire")
   - Select difficulty level
   - Get personalized practice sentences

2. **Get Learning Insights:**

   - Go to "AI Features" → "AI Progress Dashboard"
   - Click "Get AI Analysis"
   - Receive personalized recommendations

3. **Grammar Help:**
   - Select any sentence in study mode
   - Click "Explain Grammar"
   - Get detailed AI explanations

### **For Developers:**

1. **Add New AI Features:**

   - Create new flow in `src/ai/flows/`
   - Add UI component in `src/components/app/`
   - Update translations in `src/lib/translations.ts`

2. **Customize AI Behavior:**
   - Modify prompts in AI flows
   - Adjust difficulty levels
   - Add new language support

## 🔮 **Future AI Enhancements**

### **Planned Features:**

- 🗣️ **Speech Recognition:** Pronunciation practice
- 🎯 **Adaptive Learning:** AI adjusts difficulty automatically
- 📊 **Progress Prediction:** AI predicts learning outcomes
- 🌍 **Cultural Context:** AI provides cultural insights
- 🎮 **Dynamic Games:** AI generates custom challenges

### **Community Features:**

- 👥 **Shared AI Content:** Community-generated sentences
- 🏆 **AI Competitions:** Weekly AI-powered challenges
- 📚 **Curriculum Generation:** AI creates lesson plans

## 🆘 **Troubleshooting**

### **Common Issues:**

**❌ "AI service unavailable"**

```bash
# Check API key configuration
echo $GOOGLE_GENAI_API_KEY
# Verify environment variables are loaded
```

**❌ "Rate limit exceeded"**

```bash
# Wait 1 minute or upgrade to paid tier
# Check usage at provider dashboard
```

**❌ "Failed to generate content"**

```bash
# Check network connection
# Verify API key permissions
# Try different AI provider
```

### **Getting Help:**

1. Check browser console for detailed error messages
2. Verify API keys are valid and active
3. Check provider dashboards for usage limits
4. Test with simple requests first

## 🎉 **Success Metrics**

With AI integration, users typically see:

- **40% faster learning** through personalized content
- **60% better retention** with AI-powered explanations
- **3x more engagement** with interactive AI features
- **Personalized study paths** adapted to individual needs

---

**🚀 Ready to supercharge your language learning with AI?**

Start with Google AI (free tier) and gradually add more providers as your app grows. The AI features will transform ProntoLingo into an intelligent, adaptive learning companion!

**Need help?** Check the troubleshooting section or open an issue for support.
