require('dotenv').config();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

class GroqClient {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.maxRetries = 3;
    this.retryDelayMs = 1000;
    this.rateLimitQueue = [];
    this.processing = false;
    this.requestsPerMinute = 28; // stay under Groq's 30 RPM limit
    this.requestTimestamps = [];
  }

  /**
   * Rate-limited chat completion with retry logic.
   * Uses a queue to ensure we don't exceed Groq's rate limits.
   */
  async chat(messages, options = {}) {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push({ messages, options, resolve, reject });
      this._processQueue();
    });
  }

  async _processQueue() {
    if (this.processing || this.rateLimitQueue.length === 0) return;
    this.processing = true;

    while (this.rateLimitQueue.length > 0) {
      // Rate limit check: remove timestamps older than 1 minute
      const now = Date.now();
      this.requestTimestamps = this.requestTimestamps.filter(t => now - t < 60000);

      if (this.requestTimestamps.length >= this.requestsPerMinute) {
        const oldestTimestamp = this.requestTimestamps[0];
        const waitMs = 60000 - (now - oldestTimestamp) + 100;
        await this._sleep(waitMs);
        continue;
      }

      const { messages, options, resolve, reject } = this.rateLimitQueue.shift();

      try {
        const result = await this._makeRequest(messages, options);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }

    this.processing = false;
  }

  async _makeRequest(messages, options, attempt = 1) {
    const body = {
      model: options.model || GROQ_MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens || 1024,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    };

    try {
      this.requestTimestamps.push(Date.now());

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        // Rate limited — back off exponentially
        if (attempt <= this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          console.warn(`[GroqClient] Rate limited, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
          await this._sleep(delay);
          return this._makeRequest(messages, options, attempt + 1);
        }
        throw new Error('Groq API rate limit exceeded after max retries');
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Groq API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
      };
    } catch (err) {
      if (attempt <= this.maxRetries && err.code === 'ECONNRESET') {
        const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[GroqClient] Connection error, retrying in ${delay}ms`);
        await this._sleep(delay);
        return this._makeRequest(messages, options, attempt + 1);
      }
      throw err;
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isConfigured() {
    return !!this.apiKey;
  }
}

module.exports = new GroqClient();
