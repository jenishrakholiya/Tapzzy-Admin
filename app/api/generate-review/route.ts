import { NextResponse } from 'next/server';
import { generateReviewSuggestions } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessName, rating, feedback } = body;

    if (!businessName) {
      return NextResponse.json({ error: 'businessName is required' }, { status: 400 });
    }

    const suggestions = await generateReviewSuggestions(
      businessName,
      Number(rating) || 5,
      String(feedback || '')
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('API generate-review error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate review suggestions',
        suggestions: [
          'Great service and lovely atmosphere! Highly recommended.',
          'Really enjoyed my experience here. Will definitely come back.',
          'Prompt, friendly, and great attention to detail.'
        ],
      },
      { status: 500 }
    );
  }
}
