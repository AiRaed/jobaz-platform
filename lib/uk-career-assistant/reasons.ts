/**
 * Reasons Generator for UK Career Assistant
 * 
 * Generates personalized bullets and chips for direction recommendations
 * based on user state and direction characteristics.
 * 
 * NO AI - Pure deterministic logic based on user answers.
 */

export interface ReasonsResult {
  bullets: string[]  // Exactly 3 bullets, 6-10 words each
  chips: string[]    // 1-4 chips, 1-3 words each
}

/**
 * Build reasons for a direction based on state and direction ID
 */
export function buildReasons(state: any, directionId: string): ReasonsResult {
  const answers = state?.answers || {}
  const bullets: string[] = []
  const chips: string[] = []
  
  // Normalize direction ID (handle both kebab-case and snake_case)
  const normalizedDirId = directionId.toLowerCase().replace(/_/g, '-')
  
  // Extract key signals from answers
  const priorities = Array.isArray(answers['priorities']) ? answers['priorities'] : []
  const peopleComfort = answers['people_comfort']
  const language = answers['language']
  const transport = answers['transport']
  const physicalAbility = answers['physical_ability']
  const trainingOpenness = answers['training_openness']
  const goalGate = answers['goal_gate']
  const drivingInterest = answers['driving_interest']
  const experienceField = answers['experience_field']
  
  // ============================================
  // BULLETS GENERATION (3 bullets max, 6-10 words each)
  // ============================================
  
  // Priority-based bullets
  if (priorities.includes('stability')) {
    bullets.push('More stable shifts and consistent work')
  }
  if (priorities.includes('flexibility')) {
    bullets.push('Flexible scheduling options available')
  }
  if (priorities.includes('physical_ease')) {
    bullets.push('Lower physical strain requirements')
  }
  if (priorities.includes('better_income')) {
    bullets.push('Better earning potential in this field')
  }
  
  // People comfort + customer-facing directions
  if (peopleComfort === 'comfortable' && (
    normalizedDirId.includes('hospitality') || 
    normalizedDirId.includes('front') ||
    normalizedDirId.includes('care') ||
    normalizedDirId.includes('support')
  )) {
    bullets.push('Matches your comfort with customers')
  }
  
  // Language + simple communication directions
  if (language === 'basic' && (
    normalizedDirId.includes('warehouse') ||
    normalizedDirId.includes('cleaning') ||
    normalizedDirId.includes('cleaner') ||
    normalizedDirId.includes('security')
  )) {
    bullets.push('Simple communication requirements')
  }
  
  // Transport + driving directions
  if ((transport === 'car' || transport === 'van_professional' || transport === 'licence_no_car') &&
      (normalizedDirId.includes('driving') || normalizedDirId.includes('transport'))) {
    bullets.push('Fits your transport access')
  }
  
  // Physical ability + non-physical directions
  if (physicalAbility === 'prefer_non_physical' && (
    normalizedDirId.includes('office') ||
    normalizedDirId.includes('admin') ||
    normalizedDirId.includes('digital') ||
    normalizedDirId.includes('security')
  )) {
    bullets.push('Lower physical strain')
  }
  
  // Training openness + licence-based directions
  if ((trainingOpenness === 'yes_short' || trainingOpenness === 'maybe_depends') &&
      (normalizedDirId.includes('security') || 
       normalizedDirId.includes('driving') ||
       normalizedDirId.includes('construction'))) {
    bullets.push('Short training unlocks better opportunities')
  }
  
  // Goal gate + side income
  if (goalGate === 'side_income' && (
    normalizedDirId.includes('hospitality') ||
    normalizedDirId.includes('cleaning') ||
    normalizedDirId.includes('warehouse')
  )) {
    bullets.push('Flexible shifts for side income')
  }
  
  // Experience field matching
  if (experienceField && (
    (experienceField.includes('hospitality') && normalizedDirId.includes('hospitality')) ||
    (experienceField.includes('warehouse') && normalizedDirId.includes('warehouse')) ||
    (experienceField.includes('trades') && normalizedDirId.includes('construction')) ||
    (experienceField.includes('trades') && normalizedDirId.includes('maintenance'))
  )) {
    bullets.push('Builds on your existing experience')
  }
  
  // ============================================
  // CHIPS GENERATION (1-4 chips, 1-3 words each)
  // ============================================
  
  // Physical ability chips
  if (physicalAbility === 'prefer_non_physical' || physicalAbility === 'light_physical') {
    if (normalizedDirId.includes('warehouse') || 
        normalizedDirId.includes('cleaning') ||
        normalizedDirId.includes('office') ||
        normalizedDirId.includes('admin')) {
      chips.push('Low physical strain')
    }
  }
  
  // People comfort chips
  if (peopleComfort === 'comfortable' || peopleComfort === 'okay_sometimes') {
    if (normalizedDirId.includes('hospitality') || 
        normalizedDirId.includes('front') ||
        normalizedDirId.includes('care') ||
        normalizedDirId.includes('support')) {
      chips.push('Customer-facing')
    }
  }
  
  // Goal gate chips
  if (goalGate === 'side_income') {
    if (normalizedDirId.includes('hospitality') ||
        normalizedDirId.includes('cleaning') ||
        normalizedDirId.includes('warehouse')) {
      chips.push('Flexible shifts')
    }
  }
  
  // Training openness chips
  if (trainingOpenness === 'yes_short' || trainingOpenness === 'maybe_depends') {
    if (normalizedDirId.includes('security')) {
      chips.push('Licence-based')
    }
    if (normalizedDirId.includes('driving') || normalizedDirId.includes('transport')) {
      chips.push('Licence-based')
    }
    if (normalizedDirId.includes('construction')) {
      chips.push('Licence-based')
    }
    // Generic improvement chip
    if (!chips.includes('Licence-based')) {
      chips.push('Improve later')
    }
  }
  
  // Driving interest chips
  if (drivingInterest === 'yes' && (normalizedDirId.includes('driving') || normalizedDirId.includes('transport'))) {
    chips.push('Driving')
  }
  
  // Language chips
  if (language === 'basic') {
    if (normalizedDirId.includes('warehouse') ||
        normalizedDirId.includes('cleaning') ||
        normalizedDirId.includes('security')) {
      chips.push('Simple English')
    }
  }
  
  // Experience field chips
  if (experienceField === 'trades' || experienceField === 'construction_labour') {
    if (normalizedDirId.includes('construction') || normalizedDirId.includes('maintenance')) {
      chips.push('Hands-on')
    }
  }
  
  // Transport chips
  if (transport === 'car' || transport === 'van_professional') {
    if (normalizedDirId.includes('driving') || normalizedDirId.includes('transport')) {
      chips.push('Transport-friendly')
    }
  }
  
  // Night shifts chip (for warehouse/logistics)
  if (normalizedDirId.includes('warehouse') || normalizedDirId.includes('logistics')) {
    chips.push('Night shifts')
  }
  
  // Fast entry chip (for entry-level directions)
  if (normalizedDirId.includes('warehouse') ||
      normalizedDirId.includes('cleaning') ||
      normalizedDirId.includes('hospitality') ||
      normalizedDirId.includes('security')) {
    chips.push('Fast entry')
  }
  
  // ============================================
  // DEDUPE AND FILL MISSING
  // ============================================
  
  // Remove duplicate bullets
  const uniqueBullets = Array.from(new Set(bullets))
  
  // Remove duplicate chips
  const uniqueChips = Array.from(new Set(chips))
  
  // Ensure exactly 3 bullets (fill with safe defaults if needed)
  const safeDefaults = [
    'Entry-friendly option in the UK',
    'Fits your current preferences',
    'A practical next step'
  ]
  
  while (uniqueBullets.length < 3) {
    const defaultIndex = uniqueBullets.length
    if (defaultIndex < safeDefaults.length) {
      uniqueBullets.push(safeDefaults[defaultIndex])
    } else {
      uniqueBullets.push('A practical next step')
    }
  }
  
  // Limit to 3 bullets
  const finalBullets = uniqueBullets.slice(0, 3)
  
  // Limit chips to 4 max
  const finalChips = uniqueChips.slice(0, 4)
  
  return {
    bullets: finalBullets,
    chips: finalChips
  }
}

