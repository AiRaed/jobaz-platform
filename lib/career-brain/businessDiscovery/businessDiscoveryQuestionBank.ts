/**
 * JAZ Business Discovery — dynamic question bank (priority-based).
 */

import type { CareerBrainQuestion } from '../types'
import { analyzeBusinessIdea, getOpenIdeaFacets } from './businessDiscoveryDynamicQuestions'
import type { BusinessDiscoveryUnderstanding } from './businessDiscoveryTypes'

type BizQuestionDef = {
  id: string
  priority: number
  when: (u: BusinessDiscoveryUnderstanding) => boolean
  build: () => CareerBrainQuestion
}

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>,
  multi = false
): CareerBrainQuestion {
  return { id, text, type: multi ? 'multi' : 'single', options, allow_free_text: false }
}

function qFree(id: string, text: string, placeholder?: string): CareerBrainQuestion {
  return {
    id,
    text: placeholder ? `${text}\n\n(e.g. ${placeholder})` : text,
    type: 'single',
    options: [],
    allow_free_text: true,
  }
}

const BANK: BizQuestionDef[] = [
  {
    id: 'biz_intent',
    priority: 100,
    when: (u) => !u.intent,
    build: () =>
      q('biz_intent', 'Where are you with starting a business?', [
        { value: 'has_idea', label: 'I have a specific business idea' },
        { value: 'no_idea', label: 'No idea yet — want realistic options' },
        { value: 'already_running', label: 'Business already running — want to grow or fix it' },
        { value: 'unsure', label: 'Not sure business is right — open to alternatives' },
      ]),
  },
  {
    id: 'biz_idea',
    priority: 98,
    when: (u) => (u.intent === 'has_idea' || u.intent === 'already_running') && !u.businessIdea,
    build: () =>
      qFree('biz_idea', 'Describe your business idea in one sentence', 'Barber shop, domestic cleaning, SaaS for accountants'),
  },
  {
    id: 'biz_industry_field',
    priority: 96,
    when: (u) => u.intent === 'no_idea' && !u.industryField,
    build: () =>
      qFree(
        'biz_industry_field',
        'What is your main work background or strongest industry knowledge?',
        'Retail management, software development, care work, driving'
      ),
  },
  {
    id: 'biz_experience_level',
    priority: 94,
    when: (u) =>
      !!u.intent &&
      !u.experienceLevel &&
      !u.askedIds.includes('biz_dyn_experience') &&
      getOpenIdeaFacets(u).length === 0,
    build: () =>
      q('biz_experience_level', 'How much direct experience do you have in this field?', [
        { value: 'none', label: 'None — new to this industry' },
        { value: 'some', label: 'Some — hobby, study, or informal' },
        { value: '1_3_years', label: '1–3 years paid experience' },
        { value: '3_plus_years', label: '3+ years solid experience' },
        { value: 'expert', label: 'Expert / senior professional in the field' },
      ]),
  },
  {
    id: 'biz_skills',
    priority: 92,
    when: (u) =>
      !!u.intent &&
      u.skills.length === 0 &&
      u.direction === 'general' &&
      !analyzeBusinessIdea(u.businessIdea, u.industryField),
    build: () =>
      q(
        'biz_skills',
        'Which strengths could support a business? (Select all that apply)',
        [
          { value: 'technical', label: 'Technical / digital skills' },
          { value: 'sales', label: 'Sales / customer acquisition' },
          { value: 'operations', label: 'Operations / organisation' },
          { value: 'trade_craft', label: 'Trade / craft skills' },
          { value: 'people', label: 'People leadership / team management' },
          { value: 'finance', label: 'Finance / bookkeeping' },
          { value: 'marketing', label: 'Marketing / social media' },
          { value: 'none_yet', label: 'Still building commercial skills' },
        ],
        true
      ),
  },
  {
    id: 'biz_capital',
    priority: 90,
    when: (u) => !!u.intent && !u.capital,
    build: () =>
      q('biz_capital', 'What startup capital can you realistically access?', [
        { value: 'under_1k', label: 'Under £1,000' },
        { value: '1k_5k', label: '£1,000–£5,000' },
        { value: '5k_20k', label: '£5,000–£20,000' },
        { value: '20k_plus', label: '£20,000+' },
        { value: 'none', label: 'No capital — must bootstrap' },
      ]),
  },
  {
    id: 'biz_time',
    priority: 88,
    when: (u) => !!u.intent && !u.timePerWeek,
    build: () =>
      q('biz_time', 'How much time per week can you commit while starting?', [
        { value: 'under_10', label: 'Under 10 hours (side project)' },
        { value: '10_20', label: '10–20 hours' },
        { value: '20_40', label: '20–40 hours' },
        { value: 'full_time', label: 'Full-time focus' },
      ]),
  },
  {
    id: 'biz_income_expectation',
    priority: 86,
    when: (u) => !!u.intent && !u.incomeExpectation,
    build: () =>
      q('biz_income_expectation', 'What monthly income do you need from this venture (roughly)?', [
        { value: 'under_1k', label: 'Under £1,000' },
        { value: '1k_2k', label: '£1,000–£2,000' },
        { value: '2k_4k', label: '£2,000–£4,000' },
        { value: '4k_plus', label: '£4,000+' },
        { value: 'not_sure', label: 'Not sure yet' },
      ]),
  },
  {
    id: 'biz_risk_tolerance',
    priority: 84,
    when: (u) => !!u.intent && !u.riskTolerance,
    build: () =>
      q('biz_risk_tolerance', 'How much financial risk can you take?', [
        { value: 'low', label: 'Low — cannot afford losses' },
        { value: 'medium', label: 'Medium — some savings at risk' },
        { value: 'high', label: 'Higher — willing to invest for upside' },
      ]),
  },
  {
    id: 'biz_network',
    priority: 82,
    when: (u) =>
      !!u.intent &&
      !u.hasNetwork &&
      u.direction !== 'barber' &&
      u.direction !== 'cleaning' &&
      u.direction !== 'software',
    build: () =>
      q('biz_network', 'Do you already have potential customers or a useful network?', [
        { value: 'yes_customers', label: 'Yes — existing customers or warm leads' },
        { value: 'yes_network', label: 'Yes — industry contacts, not customers yet' },
        { value: 'limited', label: 'Limited network' },
        { value: 'none', label: 'Starting from zero' },
      ]),
  },
  // Direction-specific assets (replace generic biz_assets)
  {
    id: 'biz_barber_assets',
    priority: 81,
    when: (u) => u.direction === 'barber' && u.assets.length === 0 && !!u.businessIdea,
    build: () =>
      q(
        'biz_barber_assets',
        'What barber business assets do you already have? (Select all that apply)',
        [
          { value: 'tools', label: 'Barber tools / equipment' },
          { value: 'qualification', label: 'Barber qualification / certification' },
          { value: 'paying_clients', label: 'Existing paying clients' },
          { value: 'portfolio', label: 'Portfolio / photos of your work' },
          { value: 'social_media', label: 'Social media presence' },
          { value: 'industry_contacts', label: 'Local industry contacts' },
          { value: 'chair_access', label: 'Access to a chair rental opportunity' },
          { value: 'none_yet', label: 'None of these yet' },
        ],
        true
      ),
  },
  {
    id: 'biz_cleaning_assets',
    priority: 81,
    when: (u) => u.direction === 'cleaning' && u.assets.length === 0 && !!u.businessIdea,
    build: () =>
      q(
        'biz_cleaning_assets',
        'What cleaning business assets do you already have? (Select all that apply)',
        [
          { value: 'equipment', label: 'Cleaning equipment and supplies' },
          { value: 'vehicle', label: 'Vehicle / van for jobs' },
          { value: 'existing_customers', label: 'Existing customers' },
          { value: 'testimonials', label: 'References / testimonials' },
          { value: 'commercial_exp', label: 'Commercial cleaning experience' },
          { value: 'insurance', label: 'Public liability insurance already' },
          { value: 'none_yet', label: 'None of these yet' },
        ],
        true
      ),
  },
  {
    id: 'biz_software_assets',
    priority: 81,
    when: (u) => u.direction === 'software' && u.assets.length === 0 && !!u.businessIdea,
    build: () =>
      q(
        'biz_software_assets',
        'What do you already have for this software business? (Select all that apply)',
        [
          { value: 'technical_skills', label: 'Technical skills to build the product' },
          { value: 'existing_product', label: 'Existing product or prototype' },
          { value: 'audience', label: 'Audience / community in the niche' },
          { value: 'marketing', label: 'Marketing / growth experience' },
          { value: 'existing_users', label: 'Existing users or paying customers' },
          { value: 'portfolio', label: 'Portfolio / case studies' },
          { value: 'none_yet', label: 'None of these yet' },
        ],
        true
      ),
  },
  {
    id: 'biz_tutoring_assets',
    priority: 81,
    when: (u) => u.direction === 'tutoring' && u.assets.length === 0 && !!u.businessIdea,
    build: () =>
      q(
        'biz_tutoring_assets',
        'What tutoring business assets do you already have? (Select all that apply)',
        [
          { value: 'qualification', label: 'Teaching qualification or subject degree' },
          { value: 'existing_students', label: 'Existing students or enquiries' },
          { value: 'materials', label: 'Lesson plans / teaching materials' },
          { value: 'online_setup', label: 'Online teaching setup (Zoom, whiteboard, etc.)' },
          { value: 'references', label: 'References from parents or students' },
          { value: 'none_yet', label: 'None of these yet' },
        ],
        true
      ),
  },
  {
    id: 'biz_food_assets',
    priority: 81,
    when: (u) => u.direction === 'food' && u.assets.length === 0 && !!u.businessIdea,
    build: () =>
      q(
        'biz_food_assets',
        'What food business assets do you already have? (Select all that apply)',
        [
          { value: 'chef_experience', label: 'Professional kitchen experience' },
          { value: 'recipes', label: 'Tested recipes / menu' },
          { value: 'equipment', label: 'Catering or kitchen equipment' },
          { value: 'existing_customers', label: 'Existing catering customers' },
          { value: 'hygiene_training', label: 'Food hygiene certification' },
          { value: 'none_yet', label: 'None of these yet' },
        ],
        true
      ),
  },
  {
    id: 'biz_ecommerce_assets',
    priority: 81,
    when: (u) => u.direction === 'ecommerce' && u.assets.length === 0 && !!u.businessIdea,
    build: () =>
      q(
        'biz_ecommerce_assets',
        'What e-commerce assets do you already have? (Select all that apply)',
        [
          { value: 'product', label: 'Product sourced or manufactured' },
          { value: 'sales', label: 'Existing sales or orders' },
          { value: 'store', label: 'Online store / listing live' },
          { value: 'audience', label: 'Social media audience' },
          { value: 'ads_exp', label: 'Paid ads experience' },
          { value: 'none_yet', label: 'None of these yet' },
        ],
        true
      ),
  },
  {
    id: 'biz_general_assets',
    priority: 80,
    when: (u) =>
      !!u.intent &&
      u.assets.length === 0 &&
      (u.direction === 'general' ||
        u.direction === 'trades' ||
        u.direction === 'driver' ||
        u.direction === 'consultancy' ||
        u.direction === 'retail' ||
        u.direction === 'care') &&
      (!!u.businessIdea || !!u.industryField),
    build: () =>
      q(
        'biz_general_assets',
        'What business assets do you already have? (Select all that apply)',
        [
          { value: 'tools', label: 'Trade or professional tools' },
          { value: 'vehicle', label: 'Vehicle / van' },
          { value: 'customers', label: 'Existing customers' },
          { value: 'website', label: 'Website / portfolio' },
          { value: 'licences', label: 'Relevant licences' },
          { value: 'none_yet', label: 'None of these yet' },
        ],
        true
      ),
  },
  // Barber specialisation
  {
    id: 'biz_barber_experience',
    priority: 78,
    when: (u) => u.direction === 'barber' && !u.specialized.biz_barber_experience,
    build: () =>
      q('biz_barber_experience', 'What barbering experience do you have?', [
        { value: 'qualified', label: 'NVQ Level 2/3 or equivalent' },
        { value: 'shop_exp', label: 'Shop floor experience, not fully qualified' },
        { value: 'informal', label: 'Informal / friends & family only' },
        { value: 'none', label: 'No barbering experience yet' },
      ]),
  },
  {
    id: 'biz_barber_model',
    priority: 79,
    when: (u) =>
      u.direction === 'barber' &&
      !u.specialized.biz_barber_model &&
      !u.specialized.biz_barber_premises,
    build: () =>
      q('biz_barber_model', 'What business model are you considering?', [
        { value: 'chair_rental', label: 'Rent a chair' },
        { value: 'mobile', label: 'Mobile barber' },
        { value: 'home_based', label: 'Home-based barber' },
        { value: 'own_shop', label: 'Own shop' },
        { value: 'unsure', label: 'Not sure yet' },
      ]),
  },
  {
    id: 'biz_barber_customers',
    priority: 77,
    when: (u) => u.direction === 'barber' && !u.specialized.biz_barber_customers,
    build: () =>
      q('biz_barber_customers', 'Do you already have paying customers?', [
        { value: 'regular', label: 'Yes, regular clients' },
        { value: 'occasional', label: 'Some occasional clients' },
        { value: 'friends_family', label: 'Friends and family only' },
        { value: 'none', label: 'None' },
      ]),
  },
  {
    id: 'biz_barber_obstacle',
    priority: 75,
    when: (u) => u.direction === 'barber' && !u.specialized.biz_barber_obstacle,
    build: () =>
      q('biz_barber_obstacle', 'What is your biggest obstacle?', [
        { value: 'funding', label: 'Funding' },
        { value: 'customers', label: 'Customers' },
        { value: 'experience', label: 'Experience' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'legal', label: 'Legal requirements' },
        { value: 'unsure', label: 'Not sure' },
      ]),
  },
  {
    id: 'biz_barber_equipment',
    priority: 73,
    when: (u) => u.direction === 'barber' && !u.specialized.biz_barber_equipment,
    build: () =>
      q('biz_barber_equipment', 'Do you already own tools/equipment?', [
        { value: 'yes', label: 'Yes' },
        { value: 'partial', label: 'Partially' },
        { value: 'no', label: 'No' },
      ]),
  },
  {
    id: 'biz_barber_start_small',
    priority: 71,
    when: (u) => u.direction === 'barber' && !u.specialized.biz_barber_start_small,
    build: () =>
      q('biz_barber_start_small', 'Are you willing to start small before opening a full shop?', [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unsure', label: 'Not sure' },
      ]),
  },
  {
    id: 'biz_barber_uk_shop',
    priority: 69,
    when: (u) => u.direction === 'barber' && !u.specialized.biz_barber_uk_shop,
    build: () =>
      q('biz_barber_uk_shop', 'Have you worked in a UK barber shop before?', [
        { value: 'yes_current', label: 'Yes — currently or recently' },
        { value: 'yes_past', label: 'Yes — in the past' },
        { value: 'no', label: 'No — not yet' },
      ]),
  },
  // Cleaning specialisation
  {
    id: 'biz_cleaning_type',
    priority: 78,
    when: (u) => u.direction === 'cleaning' && !u.specialized.biz_cleaning_type,
    build: () =>
      q('biz_cleaning_type', 'What cleaning market would you target?', [
        { value: 'residential', label: 'Residential homes' },
        { value: 'commercial', label: 'Commercial offices' },
        { value: 'both', label: 'Both' },
        { value: 'unsure', label: 'Not sure' },
      ]),
  },
  {
    id: 'biz_cleaning_transport',
    priority: 76,
    when: (u) => u.direction === 'cleaning' && !u.specialized.biz_cleaning_transport,
    build: () =>
      q('biz_cleaning_transport', 'Do you have transport and basic equipment for cleaning jobs?', [
        { value: 'yes_full', label: 'Yes — vehicle and equipment ready' },
        { value: 'partial', label: 'Some equipment, need vehicle or supplies' },
        { value: 'no', label: 'Not yet' },
      ]),
  },
  {
    id: 'biz_cleaning_team',
    priority: 74,
    when: (u) => u.direction === 'cleaning' && !u.specialized.biz_cleaning_team,
    build: () =>
      q('biz_cleaning_team', 'How do you plan to deliver the work?', [
        { value: 'solo', label: 'Solo — I do all jobs myself' },
        { value: 'partner', label: 'With one partner or family member' },
        { value: 'hire_later', label: 'Start solo, hire cleaners later' },
        { value: 'team_ready', label: 'Small team already available' },
      ]),
  },
  {
    id: 'biz_cleaning_contracts',
    priority: 72,
    when: (u) => u.direction === 'cleaning' && !u.specialized.biz_cleaning_contracts,
    build: () =>
      q('biz_cleaning_contracts', 'What type of work are you targeting first?', [
        { value: 'one_off', label: 'One-off domestic jobs' },
        { value: 'regular_domestic', label: 'Regular domestic contracts' },
        { value: 'commercial', label: 'Commercial / office contracts' },
        { value: 'mixed', label: 'Mix of domestic and commercial' },
      ]),
  },
  {
    id: 'biz_cleaning_clients',
    priority: 70,
    when: (u) => u.direction === 'cleaning' && !u.specialized.biz_cleaning_clients,
    build: () =>
      q('biz_cleaning_clients', 'Do you already have cleaning clients or enquiries?', [
        { value: 'regular', label: 'Yes — regular clients' },
        { value: 'some', label: 'A few occasional jobs' },
        { value: 'enquiries', label: 'Enquiries but no paid jobs yet' },
        { value: 'none', label: 'None yet' },
      ]),
  },
  // Software specialisation
  {
    id: 'biz_software_model',
    priority: 78,
    when: (u) => u.direction === 'software' && !u.specialized.biz_software_model,
    build: () =>
      q('biz_software_model', 'Which model fits your situation best?', [
        { value: 'freelance', label: 'Freelance development / consulting' },
        { value: 'saas', label: 'SaaS product' },
        { value: 'agency', label: 'Small dev agency' },
        { value: 'unsure', label: 'Not sure' },
      ]),
  },
  {
    id: 'biz_software_clients',
    priority: 76,
    when: (u) => u.direction === 'software' && !u.specialized.biz_software_clients,
    build: () =>
      q('biz_software_clients', 'How would you find your first paying clients?', [
        { value: 'existing', label: 'Existing employer contacts or referrals' },
        { value: 'platforms', label: 'Freelance platforms / LinkedIn outreach' },
        { value: 'niche', label: 'Niche community or sector I know well' },
        { value: 'no_plan', label: 'No clear plan yet' },
      ]),
  },
  {
    id: 'biz_saas_technical',
    priority: 74,
    when: (u) =>
      u.direction === 'software' &&
      (u.specialized.biz_software_model === 'saas' || /saas|app|software/i.test(u.businessIdea ?? '')) &&
      !u.specialized.biz_saas_technical,
    build: () =>
      q('biz_saas_technical', 'Can you build the product yourself?', [
        { value: 'yes_full', label: 'Yes — I can build the full MVP' },
        { value: 'partial', label: 'Partially — need help with some parts' },
        { value: 'no', label: 'No — I need a technical co-founder or contractor' },
      ]),
  },
  {
    id: 'biz_saas_validation',
    priority: 72,
    when: (u) =>
      u.direction === 'software' &&
      (u.specialized.biz_software_model === 'saas' || /saas|app|software/i.test(u.businessIdea ?? '')) &&
      !u.specialized.biz_saas_validation,
    build: () =>
      q('biz_saas_validation', 'Have you validated demand for this product?', [
        { value: 'paying', label: 'Yes — paying users or signed pilots' },
        { value: 'waitlist', label: 'Waitlist or strong enquiries' },
        { value: 'interviews', label: 'Customer interviews only' },
        { value: 'none', label: 'Not validated yet' },
      ]),
  },
  {
    id: 'biz_saas_mvp',
    priority: 70,
    when: (u) =>
      u.direction === 'software' &&
      (u.specialized.biz_software_model === 'saas' || /saas|app|software/i.test(u.businessIdea ?? '')) &&
      !u.specialized.biz_saas_mvp,
    build: () =>
      q('biz_saas_mvp', 'What is your MVP plan?', [
        { value: 'built', label: 'MVP already built or nearly ready' },
        { value: '3_months', label: 'Can ship MVP within 3 months' },
        { value: '6_months', label: '6+ months to first usable version' },
        { value: 'unsure', label: 'Not sure yet' },
      ]),
  },
  // Restaurant / food
  {
    id: 'biz_food_chef_experience',
    priority: 78,
    when: (u) => u.direction === 'food' && !u.specialized.biz_food_chef_experience,
    build: () =>
      q('biz_food_chef_experience', 'What food service experience do you have?', [
        { value: 'head_chef', label: 'Head chef / kitchen management' },
        { value: 'line_cook', label: 'Line cook / sous chef experience' },
        { value: 'home_catering', label: 'Home catering or informal cooking only' },
        { value: 'none', label: 'No professional food experience' },
      ]),
  },
  {
    id: 'biz_food_premises',
    priority: 76,
    when: (u) => u.direction === 'food' && !u.specialized.biz_food_premises,
    build: () =>
      q('biz_food_premises', 'What premises model are you considering?', [
        { value: 'home_catering', label: 'Home-based catering / meal prep' },
        { value: 'pop_up', label: 'Pop-up / market stall / ghost kitchen' },
        { value: 'cafe', label: 'Café or takeaway unit' },
        { value: 'restaurant', label: 'Full restaurant premises' },
        { value: 'unsure', label: 'Not sure yet' },
      ]),
  },
  {
    id: 'biz_food_licences',
    priority: 74,
    when: (u) => u.direction === 'food' && !u.specialized.biz_food_licences,
    build: () =>
      q('biz_food_licences', 'How familiar are you with UK food business requirements?', [
        { value: 'ready', label: 'Understand hygiene rating and council registration' },
        { value: 'some', label: 'Some research done' },
        { value: 'little', label: 'Little research so far' },
      ]),
  },
  // Tutoring
  {
    id: 'biz_tutoring_qualifications',
    priority: 78,
    when: (u) => u.direction === 'tutoring' && !u.specialized.biz_tutoring_qualifications,
    build: () =>
      q('biz_tutoring_qualifications', 'What teaching qualifications or credentials do you have?', [
        { value: 'qualified_teacher', label: 'Qualified teacher (QTS or equivalent)' },
        { value: 'degree_subject', label: 'Degree in subject I teach' },
        { value: 'professional', label: 'Professional certification (accountancy, languages, etc.)' },
        { value: 'informal', label: 'Informal / no formal teaching qualification' },
      ]),
  },
  {
    id: 'biz_tutoring_subjects',
    priority: 76,
    when: (u) => u.direction === 'tutoring' && !u.specialized.biz_tutoring_subjects,
    build: () =>
      q('biz_tutoring_subjects', 'Which subjects or levels will you focus on?', [
        { value: 'primary', label: 'Primary school (KS1–KS2)' },
        { value: 'gcse', label: 'GCSE / KS3' },
        { value: 'alevel', label: 'A-Level / further education' },
        { value: 'professional', label: 'Professional exams or adult skills' },
        { value: 'mixed', label: 'Mixed levels' },
      ]),
  },
  {
    id: 'biz_tutoring_delivery',
    priority: 74,
    when: (u) => u.direction === 'tutoring' && !u.specialized.biz_tutoring_delivery,
    build: () =>
      q('biz_tutoring_delivery', 'How will you deliver tutoring?', [
        { value: 'online', label: 'Online only' },
        { value: 'in_person', label: 'In-person at student home or centre' },
        { value: 'hybrid', label: 'Hybrid online and in-person' },
        { value: 'unsure', label: 'Not sure yet' },
      ]),
  },
  // E-commerce
  {
    id: 'biz_ecommerce_product',
    priority: 78,
    when: (u) => u.direction === 'ecommerce' && !u.specialized.biz_ecommerce_product,
    build: () =>
      q('biz_ecommerce_product', 'What will you sell?', [
        { value: 'own_product', label: 'Own branded product' },
        { value: 'resale', label: 'Reselling / arbitrage' },
        { value: 'print_on_demand', label: 'Print-on-demand / dropship' },
        { value: 'unsure', label: 'Not decided yet' },
      ]),
  },
  {
    id: 'biz_ecommerce_validation',
    priority: 76,
    when: (u) => u.direction === 'ecommerce' && !u.specialized.biz_ecommerce_validation,
    build: () =>
      q('biz_ecommerce_validation', 'Have you tested whether customers will buy this?', [
        { value: 'sales', label: 'Yes — already making sales' },
        { value: 'preorders', label: 'Pre-orders or paid enquiries' },
        { value: 'research', label: 'Market research only' },
        { value: 'none', label: 'Not tested yet' },
      ]),
  },
  // Driver specialisation
  {
    id: 'biz_driver_setup',
    priority: 78,
    when: (u) => u.direction === 'driver' && !u.specialized.biz_driver_setup,
    build: () =>
      q('biz_driver_setup', 'What driving business setup are you considering?', [
        { value: 'private_hire', label: 'Private hire / airport transfers' },
        { value: 'courier', label: 'Courier / same-day delivery' },
        { value: 'man_and_van', label: 'Man and van removals' },
        { value: 'unsure', label: 'Not sure' },
      ]),
  },
  {
    id: 'biz_driver_licence',
    priority: 76,
    when: (u) => u.direction === 'driver' && !u.specialized.biz_driver_licence,
    build: () =>
      q('biz_driver_licence', 'What is your licence and vehicle status?', [
        { value: 'phv_ready', label: 'PHV licence eligible + suitable vehicle' },
        { value: 'licence_only', label: 'Full UK licence, need PHV/vehicle setup' },
        { value: 'courier_bike', label: 'Courier — bike or car without PHV' },
        { value: 'not_ready', label: 'Not ready yet' },
      ]),
  },
  // Idea validation (any direction with idea)
  {
    id: 'biz_demand_evidence',
    priority: 74,
    when: (u) =>
      u.confidence < 85 &&
      u.intent === 'has_idea' &&
      !!u.businessIdea &&
      !u.specialized.biz_demand_evidence,
    build: () =>
      q('biz_demand_evidence', 'What evidence do you have that customers want this?', [
        { value: 'paying_already', label: 'Already have paying customers' },
        { value: 'preorders', label: 'Pre-orders or strong enquiries' },
        { value: 'research', label: 'Market research only' },
        { value: 'assumption', label: 'Assumption — not validated yet' },
      ]),
  },
  {
    id: 'biz_competition_awareness',
    priority: 72,
    when: (u) =>
      u.confidence < 85 &&
      !!u.businessIdea &&
      !u.specialized.biz_competition_awareness,
    build: () =>
      q('biz_competition_awareness', 'How well do you understand local competition?', [
        { value: 'researched', label: 'Researched competitors and pricing' },
        { value: 'some', label: 'Some awareness' },
        { value: 'little', label: 'Little research so far' },
      ]),
  },
  {
    id: 'biz_first_revenue_timeline',
    priority: 70,
    when: (u) => !!u.businessIdea && !u.specialized.biz_first_revenue_timeline,
    build: () =>
      q('biz_first_revenue_timeline', 'When do you realistically need first revenue?', [
        { value: '1_month', label: 'Within 1 month' },
        { value: '3_months', label: '1–3 months' },
        { value: '6_months', label: '3–6 months' },
        { value: '12_months', label: '6–12 months is acceptable' },
      ]),
  },
]

export function pickBestBusinessDiscoveryQuestion(
  u: BusinessDiscoveryUnderstanding
): { def: BizQuestionDef; question: CareerBrainQuestion } | null {
  const answered = new Set(u.askedIds)
  const candidates = BANK.filter((def) => !answered.has(def.id) && def.when(u))
  if (!candidates.length) return null
  candidates.sort((a, b) => b.priority - a.priority)
  const def = candidates[0]!
  return { def, question: def.build() }
}

export function describeBusinessDiscoveryQuestionReason(
  defId: string,
  u: BusinessDiscoveryUnderstanding
): string {
  return `Need evidence on ${u.direction === 'general' ? 'your situation' : u.direction} before recommending a business — asking ${defId}`
}
