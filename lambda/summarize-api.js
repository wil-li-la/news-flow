import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { content } = body;

    if (!content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Content is required' })
      };
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a news summarizer. Provide a concise, objective summary of the given news article in 2-3 sentences."
        },
        {
          role: "user",
          content: `Please summarize this news article: ${content}`
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    });

    const summary = completion.choices[0]?.message?.content?.trim();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ summary })
    };

  } catch (error) {
    console.error('Summarize API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate summary' })
    };
  }
};