#!/usr/bin/env node

import axios from 'axios';
import { config } from 'dotenv';

config();

const API_KEY = process.env.OPENROUTER_API_KEY;

console.log('Testing OpenRouter API...\n');
console.log('API Key:', API_KEY.substring(0, 20) + '...');

async function test() {
  try {
    console.log('\nSending request...');
    
    const response = await axios({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/RagavRida/startup-ops-agent'
      },
      data: {
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 50
      }
    });
    
    console.log('Success!');
    console.log('Response:', response.data.choices[0].message.content);
    
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data || error.message);
  }
}

test();
