import { FH_RULES, TONE_MAP } from '../constants/data';

export function buildPrompt({
  propertyType,
  price,
  state,
  city,
  neighborhood,
  yearBuilt,
  bedrooms,
  bathrooms,
  sqft,
  lotSize,
  targetBuyer,
  highlights,
  selectedTone,
  photoCount,
  mlsCharLimit,
}) {
  const location = [neighborhood, city, state].filter(Boolean).join(', ');

  let toneInstruction;
  if (selectedTone === 'recommended') {
    toneInstruction = `AUTOMATIC — Choose the single best writing tone based on all the information provided. Consider the property type, price point, target buyer, location, photos, and features to determine the ideal tone. For example: a $2M estate targeting luxury buyers should use a luxurious and aspirational tone; a starter home for first-time buyers should use a warm and inviting tone; a modern new-build for young professionals should use a bold and energetic tone. State which tone you chose and why in one sentence before the listing description.`;
  } else {
    toneInstruction = TONE_MAP[selectedTone] || TONE_MAP.professional;
  }

  const mlsLimit = mlsCharLimit > 0 ? mlsCharLimit : 1000;

  const prompt = `You are an expert real estate copywriter who writes like a top-producing agent — specific, confident, and never generic. I've attached ${photoCount} photo${photoCount !== 1 ? 's' : ''} of a property listing. Carefully analyze ALL photos for architectural style, materials, finishes, condition, staging, landscaping, natural light, and standout features.

PROPERTY DETAILS:
${propertyType ? `- Type: ${propertyType}` : ''}
${price ? `- Listing price: ${price}` : ''}
${location ? `- Location: ${location}` : ''}
${yearBuilt ? `- Year built: ${yearBuilt}` : ''}
${bedrooms ? `- Bedrooms: ${bedrooms}` : ''}
${bathrooms ? `- Bathrooms: ${bathrooms}` : ''}
${sqft ? `- Square footage: ${sqft}` : ''}
${lotSize ? `- Lot size: ${lotSize}` : ''}
${targetBuyer ? `- Target buyer: ${targetBuyer}` : ''}
${highlights ? `- Key features: ${highlights}` : ''}

WRITING TONE: ${toneInstruction}

CRITICAL WRITING RULES:
1. Carefully examine ALL photos — reference specific visual details (materials, colors, fixtures, views) you actually see
2. NEVER use these clichéd phrases: "won't last long", "must see", "charming", "cozy" (unless under 600 sqft), "nestled", "boasts", "turn-key", "move-in ready" (unless recently renovated), "hidden gem", "entertainer's dream", "sun-drenched", "breathtaking"
3. Write like a top producer — be specific, not generic. Instead of "beautiful kitchen" say "quartz countertops with waterfall edge and soft-close cabinetry"
4. Focus on what makes this property desirable to the target buyer
5. Use "primary bedroom" or "primary suite" instead of "master bedroom" (Fair Housing compliance)
6. Never describe who should live somewhere — describe the home, not the buyer
7. Avoid proximity references to churches, schools, or other institutions that could violate Fair Housing Act

Generate exactly three versions, separated by these headers:

### FULL LISTING DESCRIPTION
Write a compelling, detailed listing description (200-300 words). Start with a powerful opening line that hooks immediately. Include specific visual details from the photos. End with a call to action.

### MLS VERSION
Write a concise MLS-optimized version (STRICTLY under ${mlsLimit} characters — count carefully). Hit the key selling points. Use standard MLS abbreviations where appropriate (BR, BA, sqft, etc.).

### SOCIAL MEDIA VERSION
Write an engaging Instagram/Facebook caption (under 150 words). Include relevant emojis. End with a call to action. Include 5-8 relevant hashtags.`;

  return prompt;
}

export function cleanFairHousing(text) {
  const fixes = [];
  let cleaned = text;

  FH_RULES.forEach(rule => {
    const before = cleaned;
    cleaned = cleaned.replace(
      rule.pattern,
      typeof rule.replace === 'function' ? rule.replace : rule.replace
    );
    if (cleaned !== before) {
      fixes.push(rule.issue);
    }
  });

  // Clean up double spaces or orphaned punctuation left by removals
  cleaned = cleaned
    .replace(/  +/g, ' ')
    .replace(/ ,/g, ',')
    .replace(/ \./g, '.')
    .replace(/\n /g, '\n')
    .trim();

  return { cleaned, fixes };
}

export function parseResults(fullResponse) {
  const fullMatch = fullResponse.match(/### FULL LISTING DESCRIPTION\s*([\s\S]*?)(?=### MLS VERSION|$)/);
  const mlsMatch = fullResponse.match(/### MLS VERSION\s*([\s\S]*?)(?=### SOCIAL MEDIA VERSION|$)/);
  const socialMatch = fullResponse.match(/### SOCIAL MEDIA VERSION\s*([\s\S]*?)$/);

  const rawFull = fullMatch ? fullMatch[1].trim() : fullResponse;
  const rawMls = mlsMatch ? mlsMatch[1].trim() : '';
  const rawSocial = socialMatch ? socialMatch[1].trim() : '';

  return { rawFull, rawMls, rawSocial };
}
