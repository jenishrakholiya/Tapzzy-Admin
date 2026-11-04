import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI | null {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey.includes('mock') || geminiKey === '[SENSITIVE]') return null;
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(geminiKey);
  }
  return genAIInstance;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function formatHumanClauses(clauses: string[]): string {
  if (clauses.length === 0) return '';
  if (clauses.length === 1) return clauses[0];
  if (clauses.length === 2) {
    return `${clauses[0]}, and ${clauses[1]}`;
  }
  return `${clauses[0]}, ${clauses[1]}, and ${clauses[2]}`;
}

/**
 * High-quality authentic human review generator.
 * Turns customer tags and notes into fluent, conversational, natural English sentences
 * that sound exactly like an everyday customer typing on Google Maps from their smartphone.
 */
function synthesizeContextualReviews(
  businessName: string,
  rating: number,
  feedback: string = '',
  tags: string[] = []
): string[] {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 5));
  const tagList = (tags || []).map((t) => t.toLowerCase());
  const cleanFeedback = (feedback || '').trim().replace(/\.$/, '');

  // Detect customer highlighted attributes
  const mentionsStaff = tagList.some(
    (t) => t.includes('staff') || t.includes('team') || t.includes('service') || t.includes('friendly') || t.includes('helpful')
  );
  const mentionsVibe = tagList.some(
    (t) => t.includes('atmosphere') || t.includes('vibe') || t.includes('ambiance')
  );
  const mentionsClean = tagList.some((t) => t.includes('clean'));
  const mentionsSpeed = tagList.some(
    (t) => t.includes('fast') || t.includes('quick') || t.includes('speed')
  );
  const mentionsQuality = tagList.some((t) => t.includes('quality') || t.includes('top'));

  // Convert customer tags into fluent, natural human spoken clauses (varied adjectives)
  const praisePoints: string[] = [];
  if (mentionsStaff) {
    praisePoints.push(
      pickRandom([
        'the staff was super friendly and helpful',
        'everyone on the team was very welcoming',
        'the customer service was polite and attentive'
      ])
    );
  }
  if (mentionsSpeed) {
    praisePoints.push(
      pickRandom([
        'service was quick and easy',
        "we didn't have to wait long at all",
        'everything went smoothly without any hassle'
      ])
    );
  }
  if (mentionsVibe) {
    praisePoints.push(
      pickRandom([
        'the place had a really nice relaxed vibe',
        'the atmosphere was very pleasant',
        'loved the welcoming energy'
      ])
    );
  }
  if (mentionsClean) {
    praisePoints.push(
      pickRandom([
        'the space was neat and spotless',
        'everything was very clean and well-kept'
      ])
    );
  }
  if (mentionsQuality) {
    praisePoints.push(
      pickRandom([
        'the quality was on point',
        'everything was well put together'
      ])
    );
  }
  if (cleanFeedback) {
    praisePoints.push(cleanFeedback);
  }

  const rawPraise = formatHumanClauses(praisePoints.slice(0, 3));
  const praiseSentence = rawPraise ? rawPraise.charAt(0).toUpperCase() + rawPraise.slice(1) : '';

  if (safeRating === 5) {
    if (praiseSentence) {
      const option1Pool = [
        `Honestly such a great experience at ${businessName}! ${praiseSentence}. Will definitely be coming back.`,
        `Really glad I stopped in today! ${praiseSentence}. 10/10 visit.`,
        `Loved coming to ${businessName}. ${praiseSentence}. Smooth visit with zero complaints.`,
        `Such a good spot! ${praiseSentence}. Very happy with everything.`
      ];

      const option2Pool = [
        `Had a really nice visit at ${businessName}. ${praiseSentence}. You can tell they genuinely care about their customers.`,
        `Always appreciate finding a place that gets it right. ${praiseSentence}. Handled everything quickly and with a smile.`,
        `First time coming by and I was really impressed. ${praiseSentence}. Left with a great impression!`,
        `Great visit all around. ${praiseSentence}. Definitely my go-to from now on.`
      ];

      const option3Pool = [
        `Solid 5 stars for ${businessName}. ${praiseSentence}. Keep up the great work!`,
        `Everything went as smoothly as possible. ${praiseSentence}. Glad to leave a well-deserved 5-star review.`,
        `Very happy with my visit today. ${praiseSentence}. Will be back soon!`,
        `Simple, quick, and pleasant visit. ${praiseSentence}. Glad I decided to stop by.`
      ];

      return [pickRandom(option1Pool), pickRandom(option2Pool), pickRandom(option3Pool)];
    }

    // 5-star without specific notes (natural, casual human smartphone drafts)
    const general1 = [
      `Had a really good visit to ${businessName} today. Everything was quick, easy, and everyone was super nice.`,
      `Honestly loved my visit here. Smooth from the moment I walked in and zero complaints.`,
      `Such a pleasant visit! Staff was really welcoming and everything ran nicely. Will definitely be back.`,
      `Super easy and enjoyable visit to ${businessName}. Glad I stopped in today!`
    ];
    const general2 = [
      `Really good vibes all around. The team was attentive, friendly, and made everything effortless.`,
      `Left with a really good impression. Clean space, friendly people, and great service.`,
      `Consistently good experience whenever I stop by. Always dependable and welcoming.`,
      `Everything went smoothly and as expected. Great place and really good people.`
    ];
    const general3 = [
      `Definitely worth 5 stars. Happy with the whole visit and will be returning soon!`,
      `Always nice finding a place that treats customers well. Thanks ${businessName}!`,
      `Great visit all around. Quick service, good energy, and zero hassle.`,
      `Solid 5-star visit. Appreciate the great care and friendly attitude here.`
    ];

    return [pickRandom(general1), pickRandom(general2), pickRandom(general3)];
  }

  if (safeRating === 4) {
    if (praiseSentence) {
      const option1Pool = [
        `Really solid visit to ${businessName}. ${praiseSentence}. Overall very happy with the experience.`,
        `Good experience here today. ${praiseSentence}. Would definitely come back.`,
        `Had a pleasant visit. ${praiseSentence}. Nice place with good people.`
      ];
      const option2Pool = [
        `Very positive visit overall. ${praiseSentence}. Handled everything nicely and with good care.`,
        `Liked the experience at ${businessName}. ${praiseSentence}. A solid 4-star visit.`,
        `Smooth visit today. ${praiseSentence}. Appreciate the helpful team.`
      ];
      const option3Pool = [
        `Overall a good experience. ${praiseSentence}. Happy with the visit and will stop by again.`,
        `Pleasant visit to ${businessName}. ${praiseSentence}. Keep up the good work!`,
        `Good people and comfortable atmosphere. ${praiseSentence}. Glad I came by.`
      ];

      return [pickRandom(option1Pool), pickRandom(option2Pool), pickRandom(option3Pool)];
    }

    const fourGen1 = [
      `Good visit to ${businessName} today. Staff was polite and everything went smoothly.`,
      `Pleasant experience all around. Helpful people and a comfortable setting.`,
      `Solid 4-star experience. In and out with no issues, happy with the service.`
    ];
    const fourGen2 = [
      `Really liked the atmosphere and the team was courteous. Would happily visit again.`,
      `Decent experience with friendly service. Everything was handled well.`,
      `Smooth visit overall. Appreciated the helpful guidance and nice vibe.`
    ];
    const fourGen3 = [
      `Good experience overall at ${businessName}. Thanks to the team for the help.`,
      `Reliable spot with pleasant service. Will definitely keep them in mind for next time.`,
      `Everything went well during my visit. Satisfied with the service.`
    ];

    return [pickRandom(fourGen1), pickRandom(fourGen2), pickRandom(fourGen3)];
  }

  // 1-3 stars (Honest, respectful human feedback)
  return [
    `Visited ${businessName} recently. The staff tried their best, but there are a few areas in service speed and consistency that could use improvement.`,
    `Sharing my honest feedback: service was okay, but a little more attention to speed and organization would make a big difference.`,
    `Fair visit overall. It has potential, hoping things run a bit smoother next time.`
  ];
}

export async function generateReviewSuggestions(
  businessName: string,
  rating: number,
  feedback: string = '',
  tags: string[] = [],
  seed?: string
): Promise<string[]> {
  const genAI = getGenAI();
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 5));
  const cleanFeedback = (feedback || '').trim();
  const cleanTags = (tags || []).filter((t) => typeof t === 'string' && t.trim().length > 0);

  if (genAI) {
    const candidateModels = ['gemini-1.5-flash', 'gemini-2.0-flash'];

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.95,
            topP: 0.95,
            maxOutputTokens: 350,
          },
        });

        const customerProvidedText = [
          cleanFeedback ? `Customer notes: "${cleanFeedback}"` : '',
          cleanTags.length > 0 ? `Selected highlights: ${cleanTags.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('; ');

        const prompt = `You are helping a customer write a genuine, everyday Google Maps review for "${businessName}".

CUSTOMER INPUT:
- Business: "${businessName}"
- Rating: ${safeRating}/5 stars
- Customer's actual notes/highlights: ${customerProvidedText || 'None provided (customer simply tapped stars)'}
- Unique Request Seed: ${seed || Math.random().toString(36).substring(7)}

HOW REAL HUMANS WRITE REVIEWS (CRITICAL - MUST NOT LOOK LIKE AI):
1. Write EXACTLY like an ordinary, everyday person typing a quick review on their smartphone while walking to their car.
2. Use casual, conversational, human language (e.g., "super friendly", "really quick", "no hassle", "nice vibe", "easy visit", "in and out quickly", "clean spot").
3. DO NOT output bullet points, raw lists of tags, or robotic formulas (e.g. NEVER write "Solid 4-star experience at [Name]. Friendly staff, Nice vibe. Good overall visit.").
4. Weave any customer highlights into natural, flowing spoken sentences (e.g. "The staff was super friendly and the place had a really nice vibe").
5. DO NOT use AI-sounding vocabulary or corporate buzzwords:
   - NEVER use words like: "impeccable", "exemplary", "meticulous", "delightful", "epitome", "testament", "haven", "plethora", "paramount", "exceptional".
   - NEVER use clichés like: "from start to finish", "top-notch quality", "exceeded my expectations", "can't recommend them enough", "you won't be disappointed", "I recently visited", "if you are looking for".
6. PUNCTUATION & FORMATTING:
   - Use simple punctuation (periods and commas).
   - NEVER use em-dashes (—) or semicolons (;). Real customers never type em-dashes on phone keypads.
   - At most ONE exclamation point in the whole review (or none). Never over-exclaim.
   - Use natural contractions ("didn't", "wasn't", "they're", "I'll", "it's").
7. ABSOLUTE TRUTHFULNESS:
   - Only mention details explicitly provided by the customer.
   - NEVER invent products, dishes, services, staff names, or fake backstory scenarios.
   - If no notes were provided, write a simple, genuine reflection of a good visit without making up fake interactions.
8. GENERATE 3 DISTINCT HUMAN OPTIONS:
   - Option 1 (Casual & quick): 1-2 punchy sentences.
   - Option 2 (Conversational & observant): 2 sentences reflecting customer highlights naturally.
   - Option 3 (Friendly closing recommendation): 1-2 grounded sentences.

OUTPUT FORMAT:
Return exactly 3 separate review drafts separated by two newlines.
Do not include option labels (e.g., "Option 1:"), bullets, numbering, quotation marks, or explanations.`;

        let timerId: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timerId = setTimeout(() => reject(new Error('AI generation timed out')), 3500);
        });

        const aiPromise = model.generateContent(prompt).then((result) => {
          const text = result.response.text();
          const lines = text
            .split(/\n\s*\n/)
            .map((l) =>
              l
                .trim()
                .replace(/^(Option\s*\d+:?|Draft\s*\d+:?|[-*•\d.]+)\s*/i, '')
                .replace(/^"|"$/g, '')
                .replace(/—|–/g, ', ')
                .trim()
            )
            .filter((l) => l.length > 15);

          if (lines.length >= 3) {
            return lines.slice(0, 3);
          }
          throw new Error('Incomplete response');
        });

        try {
          const suggestions = await Promise.race([aiPromise, timeoutPromise]);
          if (suggestions && suggestions.length >= 3) {
            return suggestions;
          }
        } finally {
          if (timerId) clearTimeout(timerId);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'AI error';
        if (!msg.includes('timed out')) {
          console.warn(`Gemini (${modelName}) note:`, msg);
        }
      }
    }
  }

  // Instant high-quality human fallback (never repeats static strings)
  return synthesizeContextualReviews(businessName, safeRating, cleanFeedback, cleanTags);
}
