import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI | null {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey.includes('mock')) return null;
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(geminiKey);
  }
  return genAIInstance;
}

function synthesizeContextualReviews(businessName: string, rating: number, feedback: string): string[] {
  const cleanFeedback = feedback.trim();
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 5));

  if (safeRating === 5) {
    if (cleanFeedback) {
      return [
        `Outstanding 5-star experience at ${businessName}! ${cleanFeedback}. The entire team was attentive, welcoming, and quick. Highly recommend to anyone looking for top-notch quality!`,
        `Loved my visit to ${businessName}. ${cleanFeedback}. Everything exceeded my expectations—professional service, fantastic atmosphere, and great attention to detail.`,
        `Can't recommend ${businessName} enough! ${cleanFeedback}. Smooth and pleasant from start to finish. Will definitely be coming back regularly!`
      ];
    }
    return [
      `Had a fantastic 5-star experience at ${businessName}. The service was warm and prompt, and the overall quality was superb. Definitely worth a visit!`,
      `Really impressed with ${businessName}. The staff made us feel right at home and everything was handled with care and efficiency. Highly recommended!`,
      `Top-notch experience from start to finish at ${businessName}. Friendly atmosphere, outstanding customer care, and great consistency. 5 stars all the way!`
    ];
  }

  if (safeRating === 4) {
    if (cleanFeedback) {
      return [
        `Really good experience at ${businessName}. ${cleanFeedback}. The staff was helpful and friendly throughout. A solid recommendation!`,
        `Enjoyed my visit to ${businessName}! ${cleanFeedback}. Very pleasant ambiance and good customer service. Looking forward to stopping by again.`,
        `A strong 4-star visit at ${businessName}. ${cleanFeedback}. Prompt service and great overall value.`
      ];
    }
    return [
      `Very good experience at ${businessName}. Prompt service, friendly staff, and a pleasant overall environment. Would recommend checking it out!`,
      `Had a pleasant visit to ${businessName}. Good attention to detail and helpful team members made for a smooth experience.`,
      `Solid 4-star experience at ${businessName}. Everything went smoothly and the staff was courteous and welcoming.`
    ];
  }

  // 1-3 stars
  if (cleanFeedback) {
    return [
      `Visited ${businessName} recently. ${cleanFeedback}. I appreciate the effort of the team, but there are a few areas that could use attention and improvement.`,
      `Sharing my honest feedback for ${businessName}. ${cleanFeedback}. Hoping management takes note so the customer experience can be improved.`,
      `My visit to ${businessName} was fair. ${cleanFeedback}. Prompt resolution and attention to detail would make a big difference.`
    ];
  }
  return [
    `Average experience at ${businessName}. The visit was okay, but there is room for improvement in overall service and speed.`,
    `Sharing honest feedback regarding my recent visit to ${businessName}. Hoping the team can refine the customer experience going forward.`,
    `A fair visit to ${businessName}. Decent service, but some noticeable areas could be improved for future customers.`
  ];
}

export async function generateReviewSuggestions(
  businessName: string,
  rating: number,
  feedback: string
): Promise<string[]> {
  const genAI = getGenAI();

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250,
        },
      });

      const prompt = `You are Tapyy AI, helping a real customer write a genuine, polished Google review for "${businessName}".
Customer rating: ${rating}/5 stars.
Customer feedback notes: "${feedback || 'Great service and overall experience'}".

Generate 3 distinct Google review options in natural, conversational, human phrasing.
- Option 1: Short & enthusiastic (1-2 sentences).
- Option 2: Detailed & balanced (2-3 sentences), naturally mentioning their highlights.
- Option 3: Warm recommendation (2 sentences).
Never sound robotic or like a paid ad. Match the ${rating}-star sentiment honestly.
Return exactly 3 separate paragraphs without numbering, bullets, labels, or quotation marks.`;

      // 3.5s timeout race to guarantee instant mobile responsiveness
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timed out')), 3500)
      );

      const aiPromise = model.generateContent(prompt).then((result) => {
        const text = result.response.text();
        const lines = text
          .split('\n\n')
          .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, '').replace(/^"|"$/g, ''))
          .filter((l) => l.length > 15);
        if (lines.length >= 3) return lines.slice(0, 3);
        throw new Error('Incomplete response');
      });

      const suggestions = await Promise.race([aiPromise, timeoutPromise]);
      if (suggestions && suggestions.length >= 3) {
        return suggestions;
      }
    } catch (err: unknown) {
      // Gracefully fall through to smart instant synthesizer
      const msg = err instanceof Error ? err.message : 'AI error';
      if (!msg.includes('timed out')) {
        console.warn('Gemini review generation note:', msg);
      }
    }
  }

  // Instant high-quality contextual synthesis
  return synthesizeContextualReviews(businessName, rating, feedback);
}

