import { NextResponse } from 'next/server';
import { generateReviewSuggestions } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessName, rating, feedback, tags, seed } = body;

    if (!businessName || typeof businessName !== 'string') {
      return NextResponse.json({ error: 'Valid businessName string is required' }, { status: 400 });
    }

    const sanitizedBusinessName = businessName.trim().slice(0, 100);
    const sanitizedFeedback = typeof feedback === 'string' ? feedback.trim().slice(0, 500) : '';
    const safeRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
    const cleanTags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim().slice(0, 50)).filter((t) => t.length > 0)
      : [];
    const sanitizedSeed = typeof seed === 'string' ? seed.slice(0, 32) : undefined;

    const suggestions = await generateReviewSuggestions(
      sanitizedBusinessName,
      safeRating,
      sanitizedFeedback,
      cleanTags,
      sanitizedSeed
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('API generate-review error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate review suggestions',
        suggestions: [
          'Everything was prompt and handled smoothly. Glad I came by.',
          'Really pleased with the experience. Helpful staff and nice vibe.',
          'Very solid visit. Easy, straightforward, and pleasant.'
        ],
      },
      { status: 500 }
    );
  }
}
