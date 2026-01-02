export interface CareerPath {
  id: string
  title: string
  icon: string
  description: string
  whoFor: string
  whatItIs: string
  needsDegree: 'no' | 'yes' | 'sometimes'
  degreeExplanation?: string
  requirements: {
    shortCourses: string[]
    certificates: string[]
    licences: string[]
    languageLevel?: string
  }
  realityCheck: {
    challenges: string[]
    commonMistakes: string[]
    timeToReady: string
  }
  courses: {
    name: string
    type: string // e.g., "College qualification (Level 2/3)", "Professional certification", "Short starter course"
    duration: string // e.g., "6-12 months", "2-4 weeks"
    funding: string // e.g., "Often funded via Adult Skills Fund", "Free online"
    keywords: string // Keywords for GOV.UK search, e.g., "community interpreting"
    externalLink?: string // Optional: for non-GOV.UK links (e.g., CIOL, City & Guilds)
    sourceType?: 'GOV.UK' | 'National Careers Service' | 'Professional Body' | 'College' | 'Other' // Course source type, defaults to 'National Careers Service'
  }[]
  courseWarning: string
  courseTransparencyNote?: string // Optional transparency note about how courses/support work
}

export const CAREER_PATHS: CareerPath[] = [
  {
    id: 'translator-interpreter',
    title: 'Translator / Interpreter',
    icon: '🌐',
    description: 'Help people communicate across languages in healthcare, legal, and business settings.',
    whoFor: 'People fluent in multiple languages who want to help others communicate.',
    whatItIs: 'You translate written documents or interpret spoken conversations between people who speak different languages. You might work in hospitals, courts, schools, or businesses. The work requires accuracy, cultural understanding, and often working under pressure.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'Introduction to Translation',
        'Interpreting Skills',
        'Ethics in Translation'
      ],
      certificates: [
        'Level 3 Certificate in Community Interpreting',
        'DPSI (Diploma in Public Service Interpreting) - for legal/medical'
      ],
      licences: [],
      languageLevel: 'Native or near-native in both languages (C1/C2 level)'
    },
    realityCheck: {
      challenges: [
        'Need to be very accurate - mistakes can have serious consequences',
        'Irregular hours - work often comes last-minute',
        'Emotionally demanding - dealing with sensitive situations',
        'Competition for well-paid assignments'
      ],
      commonMistakes: [
        'Not getting proper certification - many employers require DPSI',
        'Undercharging - research market rates',
        'Not specialising - generalists earn less than specialists'
      ],
      timeToReady: '6-12 months (with intensive training)'
    },
    courses: [
      {
        name: 'Level 3 Certificate in Community Interpreting',
        type: 'College qualification (Level 3)',
        duration: '6-12 months',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'community interpreting'
      },
      {
        name: 'DPSI (Diploma in Public Service Interpreting)',
        type: 'Professional certification',
        duration: '6-12 months',
        funding: 'Self-funded or employer-sponsored',
        keywords: 'DPSI interpreting',
        externalLink: 'https://www.ciol.org.uk/'
      },
      {
        name: 'Introduction to Translation & Interpreting',
        type: 'Short starter course',
        duration: '4-8 weeks',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'translation interpreting introduction'
      },
      {
        name: 'English for Work (if needed)',
        type: 'Language support',
        duration: '3-6 months',
        funding: 'Often free via local colleges',
        keywords: 'ESOL English work'
      }
    ],
    courseWarning: '⚠️ Avoid expensive "translation diplomas" from unaccredited providers. Check that qualifications are recognised by official UK bodies (e.g. CIOL, ITI).'
  },
  {
    id: 'electrician',
    title: 'Electrician (Non-Degree Path)',
    icon: '⚡',
    description: 'Install, maintain, and repair electrical systems in homes and businesses.',
    whoFor: 'People who enjoy hands-on work, problem-solving, and want a skilled trade career.',
    whatItIs: 'You install wiring, fix electrical faults, and ensure electrical systems are safe. You work in homes, offices, and construction sites. The work is physical, requires attention to detail, and involves following strict safety regulations.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'Electrical Installation Level 2',
        '18th Edition Wiring Regulations',
        'PAT Testing'
      ],
      certificates: [
        'Level 3 NVQ Diploma in Electrical Installation',
        'ECS (Electrotechnical Certification Scheme) Card'
      ],
      licences: [
        'Part P (for domestic work) - through NICEIC or NAPIT registration'
      ],
      languageLevel: 'Basic English for reading regulations and communicating with customers'
    },
    realityCheck: {
      challenges: [
        'Apprenticeships are competitive - many applicants for few places',
        'Physical work - climbing, lifting, working in tight spaces',
        'Need to keep up with changing regulations',
        'Self-employed route requires business skills'
      ],
      commonMistakes: [
        'Skipping the apprenticeship - experience is essential',
        'Not getting Part P registration before doing domestic work',
        'Underestimating the cost of tools and insurance'
      ],
      timeToReady: '3-4 years (apprenticeship) or 1-2 years (intensive training + experience)'
    },
    courses: [
      {
        name: 'Electrical Installation Level 2/3',
        type: 'College qualification (Level 2/3)',
        duration: '1-2 years',
        funding: 'Often funded via apprenticeships or Adult Skills Fund',
        keywords: 'electrical installation'
      },
      {
        name: '18th Edition Wiring Regulations',
        type: 'Professional certification',
        duration: '1-2 weeks',
        funding: 'Self-funded or employer-sponsored',
        keywords: '18th edition wiring regulations',
        externalLink: 'https://www.cityandguilds.com/'
      },
      {
        name: 'Electrical Installation Apprenticeship',
        type: 'Apprenticeship',
        duration: '3-4 years',
        funding: 'Fully funded - earn while you learn',
        keywords: 'electrical apprenticeship'
      },
      {
        name: 'Health & Safety in Construction',
        type: 'Short starter course',
        duration: '1-2 days',
        funding: 'Often free or low cost',
        keywords: 'construction health safety'
      }
    ],
    courseWarning: '⚠️ Avoid expensive "become an electrician in 6 weeks" courses. Proper training takes time. Check that qualifications are recognised by official UK bodies (e.g. City & Guilds, EAL).'
  },
  {
    id: 'plumbing-handyman',
    title: 'Plumbing / Handyman',
    icon: '🔧',
    description: 'Fix leaks, install fixtures, and handle general home repairs.',
    whoFor: 'People who are practical, enjoy fixing things, and want flexible work.',
    whatItIs: 'You repair and install plumbing systems, fix general household problems, and help people maintain their homes. Work can be varied - from emergency callouts to planned installations. You need good problem-solving skills and customer service.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'Plumbing Level 2',
        'Water Regulations',
        'Gas Safety (if doing gas work)'
      ],
      certificates: [
        'Level 2/3 NVQ in Plumbing',
        'WaterSafe Registration (for water regulations)'
      ],
      licences: [
        'Gas Safe Register (if working with gas) - requires ACS qualification'
      ],
      languageLevel: 'Basic English for customer communication'
    },
    realityCheck: {
      challenges: [
        'Irregular income when starting out',
        'Physical work - often in awkward positions',
        'Need your own van and tools',
        'Customer service skills are as important as technical skills'
      ],
      commonMistakes: [
        'Not getting insured before starting work',
        'Underpricing jobs - calculate all costs',
        'Skipping proper training - mistakes can be expensive'
      ],
      timeToReady: '1-2 years (with training and experience)'
    },
    courses: [
      {
        name: 'Plumbing Level 2/3',
        type: 'College qualification (Level 2/3)',
        duration: '1-2 years',
        funding: 'Often funded via Adult Skills Fund or apprenticeships',
        keywords: 'plumbing course'
      },
      {
        name: 'Water Regulations Certificate',
        type: 'Professional certification',
        duration: '1-2 days',
        funding: 'Self-funded',
        keywords: 'water regulations',
        externalLink: 'https://www.watersafe.org.uk/'
      },
      {
        name: 'Basic Plumbing Skills',
        type: 'Short starter course',
        duration: '4-8 weeks',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'plumbing basics'
      },
      {
        name: 'Health & Safety',
        type: 'Short starter course',
        duration: '1 day',
        funding: 'Often free or low cost',
        keywords: 'health safety construction'
      }
    ],
    courseWarning: '⚠️ Avoid expensive "master plumber in 4 weeks" courses. Real skills take time. Check that qualifications are recognised by official UK bodies (e.g. City & Guilds, BPEC).'
  },
  {
    id: 'driving-transport',
    title: 'Driving & Transport',
    icon: '🚗',
    description: 'Drive delivery vans, buses, or lorries to move people and goods.',
    whoFor: 'People who enjoy driving, want flexible hours, and don\'t mind being on the road.',
    whatItIs: 'You drive vehicles to transport goods or people. This could be local deliveries, long-distance haulage, or public transport. Work hours can be long, and you spend most of your time alone in a vehicle. Good driving skills and reliability are essential.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'Driver CPC (Certificate of Professional Competence) - for lorries/buses',
        'Forklift Licence (for warehouse work)'
      ],
      certificates: [
        'Full UK Driving Licence (Category B for vans)',
        'Category C (LGV) for lorries',
        'Category D (PCV) for buses'
      ],
      licences: [
        'Driver CPC (required for professional driving)',
        'Tachograph Card (for commercial vehicles)'
      ],
      languageLevel: 'Basic English for reading road signs and communicating'
    },
    realityCheck: {
      challenges: [
        'Long hours and time away from home (for long-distance)',
        'Sitting for long periods - can be hard on your body',
        'Fuel costs if self-employed',
        'Strict regulations and penalties for mistakes'
      ],
      commonMistakes: [
        'Not getting Driver CPC before applying for jobs',
        'Not checking insurance costs for self-employed drivers',
        'Underestimating vehicle maintenance costs'
      ],
      timeToReady: '2-6 months (depending on licence category)'
    },
    courses: [
      {
        name: 'LGV/PCV Training',
        type: 'Professional licence training',
        duration: '2-6 months',
        funding: 'Self-funded (can be expensive)',
        keywords: 'LGV PCV training'
      },
      {
        name: 'Driver CPC (Certificate of Professional Competence)',
        type: 'Professional certification',
        duration: '5 days (initial)',
        funding: 'Self-funded',
        keywords: 'driver CPC'
      },
      {
        name: 'Forklift Licence',
        type: 'Professional certification',
        duration: '1-3 days',
        funding: 'Often employer-funded',
        keywords: 'forklift training'
      },
      {
        name: 'Van Driver Training',
        type: 'Short starter course',
        duration: '1-2 weeks',
        funding: 'Self-funded',
        keywords: 'van driver training'
      }
    ],
    courseWarning: '⚠️ Compare training prices - they vary widely. Check trainers are DVSA approved. Avoid courses promising "guaranteed jobs" - these are often scams.'
  },
  {
    id: 'security-facilities',
    title: 'Security & Facilities',
    icon: '🛡️',
    description: 'Keep buildings and people safe through security work or facilities management.',
    whoFor: 'People who are observant, reliable, and want shift work options.',
    whatItIs: 'You monitor buildings, check people in and out, respond to incidents, and maintain security. You might work in offices, retail, events, or construction sites. The work requires staying alert, good communication, and sometimes dealing with difficult situations.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'SIA (Security Industry Authority) Training',
        'First Aid',
        'Conflict Management'
      ],
      certificates: [
        'SIA Licence (required for most security work)',
        'First Aid Certificate'
      ],
      licences: [
        'SIA Door Supervisor Licence',
        'SIA Security Guard Licence',
        'SIA CCTV Operator Licence'
      ],
      languageLevel: 'Basic English for communication and report writing'
    },
    realityCheck: {
      challenges: [
        'Shift work - often nights and weekends',
        'Can be boring - lots of waiting and watching',
        'Sometimes dealing with aggressive people',
        'Low pay for basic security roles'
      ],
      commonMistakes: [
        'Not getting SIA licence before applying - it\'s legally required',
        'Not checking if employer will pay for licence renewal',
        'Underestimating how tiring night shifts can be'
      ],
      timeToReady: '2-4 weeks (for SIA training and licence)'
    },
    courses: [
      {
        name: 'SIA Door Supervisor Training',
        type: 'Professional certification',
        duration: '4-6 days',
        funding: 'Self-funded (around £200-300)',
        keywords: 'SIA door supervisor'
      },
      {
        name: 'SIA Security Guard Training',
        type: 'Professional certification',
        duration: '3-4 days',
        funding: 'Self-funded',
        keywords: 'SIA security guard'
      },
      {
        name: 'First Aid Certificate',
        type: 'Short starter course',
        duration: '1 day',
        funding: 'Often employer-funded or low cost',
        keywords: 'first aid training',
        externalLink: 'https://www.sja.org.uk/'
      },
      {
        name: 'Conflict Management',
        type: 'Short starter course',
        duration: '1 day',
        funding: 'Often included in SIA training',
        keywords: 'conflict management security'
      }
    ],
    courseWarning: '⚠️ Only use SIA-approved training providers. Check the SIA website for approved providers. Avoid providers promising "guaranteed jobs".'
  },
  {
    id: 'care-support',
    title: 'Care & Support (Non-Medical)',
    icon: '❤️',
    description: 'Help people live independently by providing personal care and support.',
    whoFor: 'People who are patient, compassionate, and want to make a difference in others\' lives.',
    whatItIs: 'You help people with daily tasks like washing, dressing, eating, and taking medication. You might work in people\'s homes, care homes, or day centres. The work is rewarding but can be physically and emotionally demanding. You build relationships with the people you care for.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'Care Certificate (often provided by employer)',
        'Moving and Handling',
        'Safeguarding Adults'
      ],
      certificates: [
        'Care Certificate',
        'Level 2/3 Diploma in Health and Social Care (optional but helpful)'
      ],
      licences: [
        'DBS Check (Disclosure and Barring Service) - required for all care work'
      ],
      languageLevel: 'Good English for understanding care plans and communicating'
    },
    realityCheck: {
      challenges: [
        'Emotionally demanding - seeing people struggle',
        'Physical work - lifting and moving people',
        'Low pay for the responsibility',
        'Shift work including nights and weekends'
      ],
      commonMistakes: [
        'Not getting DBS check before applying',
        'Not understanding the emotional demands',
        'Accepting jobs without proper training'
      ],
      timeToReady: '2-4 weeks (for DBS and basic training)'
    },
    courses: [
      {
        name: 'Care Certificate',
        type: 'Professional certification',
        duration: '12 weeks (usually provided by employer)',
        funding: 'Usually employer-funded',
        keywords: 'care certificate',
        externalLink: 'https://www.skillsforcare.org.uk/'
      },
      {
        name: 'Health and Social Care Level 2/3',
        type: 'College qualification (Level 2/3)',
        duration: '6-12 months',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'health social care'
      },
      {
        name: 'Moving and Handling',
        type: 'Short starter course',
        duration: '1 day',
        funding: 'Often employer-funded',
        keywords: 'moving handling care'
      },
      {
        name: 'Safeguarding Adults',
        type: 'Short starter course',
        duration: 'Half day',
        funding: 'Often free via employer',
        keywords: 'safeguarding adults'
      }
    ],
    courseWarning: '⚠️ You don\'t need to pay for expensive care courses before getting a job. Most employers provide the Care Certificate. Be wary of courses promising "guaranteed employment".'
  },
  {
    id: 'office-admin',
    title: 'Office & Admin (Entry-Level)',
    icon: '📋',
    description: 'Handle paperwork, answer phones, organise schedules, and support office operations.',
    whoFor: 'People who are organised, good with computers, and want a stable office environment.',
    whatItIs: 'You answer phones, file documents, type letters, organise meetings, and help keep an office running smoothly. You work in an office environment, usually regular hours. The work requires good computer skills, attention to detail, and communication.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'Microsoft Office (Word, Excel, Outlook)',
        'Customer Service',
        'Business Administration Level 2'
      ],
      certificates: [
        'Level 2/3 Certificate in Business Administration (optional)',
        'IT Skills Certificate'
      ],
      licences: [],
      languageLevel: 'Good English for written and spoken communication'
    },
    realityCheck: {
      challenges: [
        'Competitive - many people apply for admin jobs',
        'Can be repetitive',
        'Need to be good at multitasking',
        'Starting pay is often minimum wage'
      ],
      commonMistakes: [
        'Not having basic IT skills - learn Word and Excel',
        'Not tailoring CV to show admin-relevant skills',
        'Underestimating the importance of customer service skills'
      ],
      timeToReady: '1-3 months (to learn basic skills)'
    },
    courses: [
      {
        name: 'Business Administration Level 2/3',
        type: 'College qualification (Level 2/3)',
        duration: '6-12 months',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'business administration'
      },
      {
        name: 'Microsoft Office Skills',
        type: 'Short starter course',
        duration: '4-8 weeks',
        funding: 'Free online',
        keywords: 'Microsoft Office',
        externalLink: 'https://learn.microsoft.com/'
      },
      {
        name: 'Customer Service',
        type: 'Short starter course',
        duration: '2-4 weeks',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'customer service'
      },
      {
        name: 'English for Work (if needed)',
        type: 'Language support',
        duration: '3-6 months',
        funding: 'Often free via local colleges',
        keywords: 'ESOL English work'
      }
    ],
    courseWarning: '⚠️ You don\'t need expensive courses. Many skills can be learned free online. Focus on practical experience - volunteer or do temporary work to build your CV.'
  },
  {
    id: 'digital-ai-beginner',
    title: 'Digital & AI-Adjacent (Beginner)',
    icon: '💻',
    description: 'Work with technology in entry-level roles like data entry, content moderation, or basic digital support.',
    whoFor: 'People interested in technology who want to start without a degree and work their way up.',
    whatItIs: 'You might work in data entry, content moderation, basic website updates, or customer support for tech companies. These are entry-level roles that don\'t require coding but give you exposure to the tech industry. You can learn on the job and potentially move into higher-skilled roles.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'Basic Computer Skills',
        'Data Entry',
        'Introduction to Digital Marketing (optional)'
      ],
      certificates: [
        'IT Skills Certificate',
        'Google Digital Garage Certificate (free)'
      ],
      licences: [],
      languageLevel: 'Good English for written communication'
    },
    realityCheck: {
      challenges: [
        'Starting roles are often low-paid',
        'Can be repetitive work',
        'Competition for better roles',
        'Need to continuously learn to progress'
      ],
      commonMistakes: [
        'Not learning basic skills before applying',
        'Not showing willingness to learn',
        'Thinking you need expensive coding bootcamps to start'
      ],
      timeToReady: '1-2 months (to learn basic digital skills)'
    },
    courses: [
      {
        name: 'Digital Skills Level 2',
        type: 'College qualification (Level 2)',
        duration: '3-6 months',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'digital skills'
      },
      {
        name: 'Google Digital Garage',
        type: 'Short starter course',
        duration: '4-8 weeks',
        funding: 'Free online',
        keywords: 'digital marketing',
        externalLink: 'https://learndigital.withgoogle.com/digitalgarage'
      },
      {
        name: 'Basic IT Skills',
        type: 'Short starter course',
        duration: '4-8 weeks',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'IT skills basic'
      },
      {
        name: 'Data Entry Skills',
        type: 'Short starter course',
        duration: '2-4 weeks',
        funding: 'Often free online',
        keywords: 'data entry'
      }
    ],
    courseWarning: '⚠️ Avoid expensive "become a digital expert" courses. Start with free resources. Many tech companies value practical experience and willingness to learn over expensive certificates. Free learning platforms like Google Digital Garage are a great way to build confidence and basic digital knowledge, but employers usually value practical skills and willingness to learn over certificates alone.'
  },
  {
    id: 'construction-trades',
    title: 'Construction & Skilled Trades',
    icon: '🏗️',
    description: 'Build, repair, and maintain structures as a carpenter, bricklayer, or general construction worker.',
    whoFor: 'People who enjoy physical work, working outdoors, and seeing tangible results.',
    whatItIs: 'You work on construction sites building or repairing buildings. This could be carpentry, bricklaying, plastering, or general labouring. The work is physical, often outdoors, and requires following safety procedures. You work as part of a team to complete projects.\n\nConstruction careers are built through hands-on experience over time. Short courses help you start safely, but long-term progression comes from site work, apprenticeships, and recognised NVQ qualifications.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'CSCS Card (Construction Skills Certification Scheme)',
        'Health and Safety in Construction',
        'Trade-specific training (carpentry, bricklaying, etc.)'
      ],
      certificates: [
        'CSCS Card (required for most construction sites)',
        'Level 2/3 NVQ in chosen trade'
      ],
      licences: [
        'CSCS Card'
      ],
      languageLevel: 'Basic English for understanding instructions and safety signs'
    },
    realityCheck: {
      challenges: [
        'Physical work - can be tiring',
        'Weather-dependent for outdoor work',
        'Work can be seasonal',
        'Need to keep up with safety regulations'
      ],
      commonMistakes: [
        'Not getting CSCS card before applying',
        'Not having proper safety training',
        'Underestimating the physical demands'
      ],
      timeToReady: '2-6 months (depending on trade and training route)'
    },
    courses: [
      {
        name: 'CSCS Card Training',
        type: 'Professional certification',
        duration: '1 day',
        funding: 'Self-funded (around £50-100)',
        keywords: 'CSCS card',
        externalLink: 'https://www.cscs.uk.com/'
      },
      {
        name: 'Construction Trade Courses (Carpentry, Bricklaying, etc.)',
        type: 'College qualification (Level 2/3)',
        duration: '1-2 years',
        funding: 'Often funded via apprenticeships or Adult Skills Fund',
        keywords: 'construction trade'
      },
      {
        name: 'Construction Apprenticeship',
        type: 'Apprenticeship',
        duration: '2-3 years',
        funding: 'Fully funded - earn while you learn',
        keywords: 'construction apprenticeship'
      },
      {
        name: 'Health & Safety in Construction',
        type: 'Short starter course',
        duration: '1 day',
        funding: 'Often required for CSCS card',
        keywords: 'construction health safety'
      }
    ],
    courseWarning: '⚠️ Check that courses are CITB or City & Guilds approved. Avoid expensive "quick construction courses" that don\'t lead to proper qualifications.'
  },
  {
    id: 'cleaner',
    title: 'Cleaner (Commercial & Domestic)',
    icon: '🧹',
    description: 'Keep buildings clean and tidy in offices, homes, or public spaces.',
    whoFor: 'People who take pride in cleanliness, want flexible hours, and don\'t mind physical work.',
    whatItIs: 'You clean buildings - offices, homes, schools, or hospitals. This might be regular cleaning or one-off deep cleans. The work is physical, often done early morning or evening, and requires attention to detail. You work independently or as part of a team.\n\nCleaning work is easy to start, but consistency, reliability, and attention to detail are what keep you employed long-term. Short courses help you work safely, while experience builds trust with employers.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'COSHH (Control of Substances Hazardous to Health)',
        'Manual Handling',
        'Infection Control (for healthcare cleaning)'
      ],
      certificates: [
        'COSHH Certificate',
        'Infection Control Certificate (for healthcare)'
      ],
      licences: [],
      languageLevel: 'Basic English for understanding safety instructions'
    },
    realityCheck: {
      challenges: [
        'Early morning or evening hours',
        'Physical work - lots of bending and lifting',
        'Low pay',
        'Can be repetitive'
      ],
      commonMistakes: [
        'Not understanding COSHH regulations',
        'Not having proper insurance if self-employed',
        'Undercharging for services'
      ],
      timeToReady: '1-2 weeks (for basic training)'
    },
    courses: [
      {
        name: 'COSHH Training',
        type: 'Short starter course',
        duration: 'Half day',
        funding: 'Often free or low cost',
        keywords: 'COSHH training',
        externalLink: 'https://www.hse.gov.uk/coshh/'
      },
      {
        name: 'Infection Control',
        type: 'Short starter course',
        duration: 'Half day',
        funding: 'Often employer-funded',
        keywords: 'infection control cleaning'
      },
      {
        name: 'Manual Handling',
        type: 'Short starter course',
        duration: 'Half day',
        funding: 'Often free or low cost',
        keywords: 'manual handling'
      },
      {
        name: 'Commercial Cleaning',
        type: 'Short starter course',
        duration: '1-2 days',
        funding: 'Often employer-funded',
        keywords: 'commercial cleaning'
      }
    ],
    courseWarning: '⚠️ Basic cleaning doesn\'t require expensive courses. Focus on getting COSHH training and practical experience.'
  },
  {
    id: 'warehouse-logistics',
    title: 'Warehouse & Logistics',
    icon: '📦',
    description: 'Organise, pack, and move goods in warehouses and distribution centres.',
    whoFor: 'People who are organised, can work quickly, and don\'t mind physical work.',
    whatItIs: 'You pick orders, pack goods, load vehicles, and keep track of inventory in warehouses. You might work with forklifts, scanning systems, and conveyor belts. The work is fast-paced, physical, and requires accuracy. You work as part of a team to meet delivery deadlines.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'Forklift Licence (Counterbalance or Reach)',
        'Manual Handling',
        'Warehouse Operations'
      ],
      certificates: [
        'Forklift Licence (increases job opportunities)',
        'Level 2 Certificate in Warehousing'
      ],
      licences: [
        'Forklift Licence'
      ],
      languageLevel: 'Basic English for reading orders and safety instructions'
    },
    realityCheck: {
      challenges: [
        'Physical work - lots of lifting and moving',
        'Fast-paced - need to work quickly and accurately',
        'Can be repetitive',
        'Often shift work including nights'
      ],
      commonMistakes: [
        'Not getting forklift licence - it opens many more opportunities',
        'Not understanding the physical demands',
        'Not showing reliability - attendance is crucial'
      ],
      timeToReady: '2-4 weeks (with forklift training)'
    },
    courses: [
      {
        name: 'Forklift Licence (Counterbalance or Reach)',
        type: 'Professional certification',
        duration: '1-3 days',
        funding: 'Often employer-funded',
        keywords: 'forklift training',
        externalLink: 'https://www.rtitb.co.uk/'
      },
      {
        name: 'Warehouse Operations Level 2',
        type: 'College qualification (Level 2)',
        duration: '3-6 months',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'warehouse operations'
      },
      {
        name: 'Manual Handling',
        type: 'Short starter course',
        duration: 'Half day',
        funding: 'Often free or low cost',
        keywords: 'manual handling'
      },
      {
        name: 'Health & Safety',
        type: 'Short starter course',
        duration: '1 day',
        funding: 'Often free or low cost',
        keywords: 'health safety warehouse'
      }
    ],
    courseWarning: '⚠️ Only use RTITB or ITSSAR approved forklift training. Check the provider is accredited. Avoid "cheap" training that doesn\'t give proper certification. Forklift licences must be issued by recognised UK bodies. Some official training providers may show browser security warnings due to outdated websites, but the qualification itself remains valid when issued by approved organisations.'
  },
  {
    id: 'hospitality-front',
    title: 'Hospitality & Front of House',
    icon: '🍽️',
    description: 'Serve customers in restaurants, hotels, cafes, or events.',
    whoFor: 'People who are friendly, enjoy working with others, and want varied work.',
    whatItIs: 'You serve customers in restaurants, cafes, hotels, or events. This might be taking orders, serving food, making drinks, or checking guests in. The work is customer-facing, fast-paced, and requires good people skills. You work as part of a team in a social environment.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'Food Hygiene Certificate (Level 2)',
        'Customer Service',
        'Licensed Premises (if serving alcohol)'
      ],
      certificates: [
        'Food Hygiene Certificate (required for handling food)',
        'Personal Licence (for serving alcohol)'
      ],
      licences: [
        'Personal Licence (if serving alcohol)'
      ],
      languageLevel: 'Good English for customer communication'
    },
    realityCheck: {
      challenges: [
        'Evening and weekend work',
        'Dealing with difficult customers',
        'Fast-paced and can be stressful',
        'Often minimum wage or low pay'
      ],
      commonMistakes: [
        'Not getting Food Hygiene certificate',
        'Not understanding the physical demands (being on your feet)',
        'Not showing customer service skills in applications'
      ],
      timeToReady: '1-2 weeks (for basic certificates)'
    },
    courses: [
      {
        name: 'Food Hygiene Level 2',
        type: 'Professional certification',
        duration: 'Half day',
        funding: 'Self-funded (around £20-30)',
        keywords: 'food hygiene',
        externalLink: 'https://www.highfield.co.uk/'
      },
      {
        name: 'Customer Service',
        type: 'Short starter course',
        duration: '2-4 weeks',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'customer service'
      },
      {
        name: 'Hospitality & Catering',
        type: 'College qualification (Level 2)',
        duration: '6-12 months',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'hospitality catering'
      },
      {
        name: 'Personal Licence (for serving alcohol)',
        type: 'Professional certification',
        duration: '1 day training + exam',
        funding: 'Self-funded',
        keywords: 'personal licence alcohol'
      }
    ],
    courseWarning: '⚠️ Food Hygiene certificates are cheap and quick to get. Don\'t pay for expensive "hospitality management" courses to start - get experience first. Hospitality certificates such as Food Hygiene and Personal Licence must be issued by recognised UK awarding bodies. Some official training providers may redirect you to awarding organisations or display security or privacy notices due to older websites, but the qualification remains valid when obtained through approved providers.'
  },
  {
    id: 'teaching-support',
    title: 'Teaching & School Support',
    icon: '📚',
    description: 'Support teachers and students in schools as a teaching assistant or learning support worker.',
    whoFor: 'People who are patient, enjoy working with children, and want to make a difference in education.',
    whatItIs: 'You help teachers in classrooms, support individual students, prepare learning materials, and supervise activities. You work in schools during term time, usually regular hours. The work is rewarding but requires patience, good communication, and sometimes dealing with challenging behaviour.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'Supporting Teaching and Learning Level 2/3',
        'Safeguarding Children',
        'Behaviour Management'
      ],
      certificates: [
        'Level 2/3 Certificate in Supporting Teaching and Learning',
        'Safeguarding Certificate'
      ],
      licences: [
        'DBS Check (required for all school work)'
      ],
      languageLevel: 'Good English for supporting learning and communication'
    },
    realityCheck: {
      challenges: [
        'Dealing with challenging behaviour',
        'Can be emotionally demanding',
        'Term-time only work (no pay in holidays unless on permanent contract)',
        'Competitive - many people want these roles'
      ],
      commonMistakes: [
        'Not getting DBS check before applying',
        'Not having relevant experience with children',
        'Not understanding the emotional demands'
      ],
      timeToReady: '3-6 months (with training and DBS)'
    },
    courses: [
      {
        name: 'Supporting Teaching and Learning Level 2/3',
        type: 'College qualification (Level 2/3)',
        duration: '6-12 months',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'supporting teaching learning'
      },
      {
        name: 'Safeguarding Children',
        type: 'Short starter course',
        duration: 'Half day',
        funding: 'Often free via schools or local authorities',
        keywords: 'safeguarding children'
      },
      {
        name: 'Behaviour Management',
        type: 'Short starter course',
        duration: '1 day',
        funding: 'Often employer-funded',
        keywords: 'behaviour management school'
      },
      {
        name: 'English for Work (if needed)',
        type: 'Language support',
        duration: '3-6 months',
        funding: 'Often free via local colleges',
        keywords: 'ESOL English work'
      }
    ],
    courseWarning: '⚠️ You don\'t need expensive courses. Many schools provide training. Volunteer in schools first to get experience and see if you like it.'
  },
  {
    id: 'maintenance-facilities',
    title: 'Maintenance & Facilities Assistant',
    icon: '🔨',
    description: 'Keep buildings running smoothly by fixing problems and doing routine maintenance.',
    whoFor: 'People who are practical, can fix things, and want varied work.',
    whatItIs: 'You fix problems in buildings - broken lights, leaking taps, faulty heating, or general repairs. You might work in offices, schools, hospitals, or housing. The work is varied, requires problem-solving, and you often work independently. You respond to requests and do routine maintenance checks.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'Basic Plumbing',
        'Basic Electrical (non-qualified work)',
        'Health and Safety',
        'PAT Testing'
      ],
      certificates: [
        'Level 2 Certificate in Facilities Services',
        'PAT Testing Certificate'
      ],
      licences: [],
      languageLevel: 'Basic English for understanding work orders and communicating'
    },
    realityCheck: {
      challenges: [
        'Need to know a bit about many things',
        'Sometimes working in awkward spaces',
        'Need to prioritise urgent vs routine work',
        'Physical work'
      ],
      commonMistakes: [
        'Not understanding what you can and can\'t do legally (electrical work)',
        'Not having basic tools',
        'Not getting proper training before attempting repairs'
      ],
      timeToReady: '2-4 months (with training)'
    },
    courses: [
      {
        name: 'Facilities Services Level 2',
        type: 'College qualification (Level 2)',
        duration: '6-12 months',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'facilities management'
      },
      {
        name: 'PAT Testing Certificate',
        type: 'Professional certification',
        duration: '1 day',
        funding: 'Self-funded',
        keywords: 'PAT testing'
      },
      {
        name: 'Basic Maintenance Skills',
        type: 'Short starter course',
        duration: '4-8 weeks',
        funding: 'Often funded via Adult Skills Fund',
        keywords: 'maintenance skills'
      },
      {
        name: 'Health & Safety',
        type: 'Short starter course',
        duration: '1 day',
        funding: 'Often free or low cost',
        keywords: 'health safety'
      }
    ],
    courseWarning: '⚠️ Don\'t attempt electrical work without proper qualifications. Focus on general maintenance skills first. Check that qualifications are recognised by official UK bodies.'
  },
  {
    id: 'self-employed-freelance',
    title: 'Self-Employed Basics / Freelance Starter',
    icon: '💼',
    description: 'Start your own small business or work as a freelancer in various fields.',
    whoFor: 'People who want to be their own boss, have a skill to offer, and are willing to handle the business side.',
    whatItIs: 'You work for yourself, finding your own clients and managing your own business. This could be cleaning, handyman work, tutoring, pet care, or any service you can offer. You have freedom but also responsibility - you need to find work, manage money, and handle taxes. Success depends on your skills, marketing, and reliability.',
    needsDegree: 'no',
    requirements: {
      shortCourses: [
        'Setting Up a Business',
        'Basic Bookkeeping',
        'Marketing Basics',
        'Tax and National Insurance for Self-Employed'
      ],
      certificates: [],
      licences: [
        'Register as self-employed with HMRC (required if earning over threshold)',
        'Public Liability Insurance (recommended)'
      ],
      languageLevel: 'Good English for communicating with clients and handling paperwork'
    },
    realityCheck: {
      challenges: [
        'Irregular income - especially at the start',
        'Need to find your own clients',
        'Responsible for your own taxes and paperwork',
        'No paid holidays or sick pay',
        'Need to be self-motivated'
      ],
      commonMistakes: [
        'Not registering with HMRC when required',
        'Not keeping proper records from the start',
        'Underpricing services',
        'Not getting insurance',
        'Not having a plan for finding clients'
      ],
      timeToReady: '1-3 months (to set up and start finding clients)'
    },
    courses: [
      {
        name: 'Setting Up a Business',
        type: 'Short starter course',
        duration: '4-8 weeks',
        funding: 'Often free via local business support',
        keywords: 'starting business'
      },
      {
        name: 'Basic Bookkeeping',
        type: 'Short starter course',
        duration: '2-4 weeks',
        funding: 'Often free online or via local support',
        keywords: 'bookkeeping basics'
      },
      {
        name: 'Business Support & Loans',
        type: 'Business support',
        duration: 'Ongoing',
        funding: 'Free advice and potential loans',
        keywords: 'business support',
        externalLink: 'https://www.startuploans.co.uk/'
      },
      {
        name: 'Marketing Basics',
        type: 'Short starter course',
        duration: '2-4 weeks',
        funding: 'Often free online',
        keywords: 'marketing basics'
      }
    ],
    courseWarning: '⚠️ You don\'t need expensive "business coaching" courses to start. Use free resources from HMRC, Prince\'s Trust, and local business support. Focus on getting your first clients.',
    courseTransparencyNote: 'Self-employment support in the UK is provided through a mix of courses, local councils, and business support schemes. Some official links may lead to general guidance or funding information rather than fixed courses, but these resources are the correct starting point for registering, funding, and growing a small business legally.'
  }
]

export function getCareerPathById(id: string): CareerPath | undefined {
  return CAREER_PATHS.find(path => path.id === id)
}


