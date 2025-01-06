import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function POST(request: Request) {
  try {
    const { startNodes, goalNodes } = await request.json();

    if (!startNodes?.length || !goalNodes?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing start or goal nodes' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Given the following research plan:
    Start nodes: ${JSON.stringify(startNodes)}
    Goal nodes: ${JSON.stringify(goalNodes)}
    
    Generate a sequence of up to four concrete, actionable steps that bridge the gap between the start and goal nodes.
    Each step should be specific and clearly contribute to reaching the goal.
    Return the response as a JSON array of objects, where each object has a 'title' and 'markdown' field.
    Example format:
    [
      {
        "title": "Literature Review",
        "markdown": "Conduct a comprehensive review of existing literature..."
      }
    ]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful research planning assistant that generates concrete, actionable steps to bridge gaps in research plans. Always respond with valid JSON arrays containing objects with 'title' and 'markdown' fields."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    let parsedResponse;
    try {
      const parsed = JSON.parse(content);
      // The response might be wrapped in a steps array or be the array itself
      parsedResponse = parsed.steps || parsed;
      
      if (!Array.isArray(parsedResponse) || !parsedResponse.every(step => 
        typeof step === 'object' && 
        typeof step.title === 'string' && 
        typeof step.markdown === 'string'
      )) {
        throw new Error('Invalid response format from OpenAI');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse OpenAI response');
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in autocomplete:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate steps',
        details: error.message || 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 