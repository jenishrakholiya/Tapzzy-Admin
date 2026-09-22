import { NextResponse } from 'next/server';
import { generateReviewSuggestions } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessName, rating, feedback } = body;

    if (!businessName || typeof businessName !== 'string') {
      return NextResponse.json({ error: 'Valid businessName string is required' }, { status: 400 });
    }

    const sanitizedBusinessName = businessName.trim().slice(0, 100);
    const sanitizedFeedback = typeof feedback === 'string' ? feedback.trim().slice(0, 500) : '';
    const safeRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));

    const suggestions = await generateReviewSuggestions(
      sanitizedBusinessName,
      safeRating,
      sanitizedFeedback
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
