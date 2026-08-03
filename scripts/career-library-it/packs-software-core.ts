/**
 * IT role packs for Software / Full Stack / Frontend / Backend
 * using it_skill_experience stage keys.
 */

import { r, type SpecialismPack } from './shared'

const BCS = 'BCS, The Chartered Institute for IT'
const SOURCES = [
  'prospects_software_developer',
  'national_careers_service_software_developer',
  'bcs_careers',
  'govuk_digital_data_technology',
]

const CORE_SLUGS = [
  'software-development',
  'full-stack-development',
  'frontend-development',
  'backend-development',
] as const

function siblings(self: string): string[] {
  return CORE_SLUGS.filter((s) => s !== self)
}

export const SOFTWARE_CORE_PACKS: SpecialismPack[] = [
  // -------------------------------------------------------------------------
  // Software Development
  // -------------------------------------------------------------------------
  {
    slug: 'software-development',
    label: 'Software Development',
    professionalBody: BCS,
    relatedBodies: ['CompTIA', 'Microsoft', 'AWS'],
    sources: SOURCES,
    siblingSlugs: siblings('software-development'),
    roles: [
      r(
        'Software Development Apprentice',
        'entry_trainee',
        'UK digital/software apprenticeship building coding, testing and delivery skills under supervision.',
        {
          priority: 10,
          eligibilityNote:
            'Broad software entry — not Frontend, Backend or Full Stack–specific apprenticeships.',
        }
      ),
      r(
        'Trainee Software Developer',
        'entry_trainee',
        'Structured trainee pathway for career starters building general application software skills with mentoring.',
        {
          priority: 20,
          eligibilityNote: 'General software trainee — not stack-specific trainee titles.',
        }
      ),
      r(
        'Graduate Software Developer',
        'entry_trainee',
        'Graduate-scheme style entry building products or internal systems; portfolio or relevant study helpful but not mandatory.',
        {
          priority: 30,
          roleCategory: 'graduate_entry',
          academicRequirement: 'degree_relevant',
          eligibilityNote:
            'Graduate software entry — degree useful, not required for all UK employers.',
        }
      ),
      r(
        'Junior Software Developer',
        'junior',
        'Early-career developer delivering small features with code review and mentoring support.',
        {
          priority: 40,
          eligibilityNote: 'Junior generalist software — not Junior Frontend/Backend/Full Stack.',
        }
      ),
      r(
        'Associate Software Engineer',
        'junior',
        'Associate-level engineering role contributing to services or applications with close guidance.',
        {
          priority: 50,
          eligibilityNote: 'Associate software engineer — broad product/engineering context.',
        }
      ),
      r(
        'Junior Application Programmer',
        'junior',
        'Supports application builds, bug fixes and maintenance on established codebases.',
        {
          priority: 60,
          eligibilityNote: 'Application programming focus — not UI-only or API-only specialisms.',
        }
      ),
      r(
        'Software Developer',
        'practitioner',
        'Independent delivery of features across the software lifecycle with growing ownership.',
        {
          priority: 70,
          eligibilityNote: 'Core practitioner software role — distinct from Full Stack Developer.',
        }
      ),
      r(
        'Software Engineer',
        'practitioner',
        'Builds and maintains software systems with testing, collaboration and iterative delivery.',
        {
          priority: 80,
          eligibilityNote: 'General software engineer — not Frontend Engineer or Backend Engineer.',
        }
      ),
      r(
        'Application Developer',
        'practitioner',
        'Delivers business or product applications with focus on reliability and maintainability.',
        {
          priority: 90,
          eligibilityNote: 'Application developer pathway within general software development.',
        }
      ),
      r(
        'Mid-Level Software Developer',
        'experienced',
        'Experienced contributor owning medium-complexity features and mentoring juniors informally.',
        {
          priority: 100,
          eligibilityNote: 'Experienced generalist software — not Mid-Level Frontend/Backend.',
        }
      ),
      r(
        'Software Engineer (Experienced)',
        'experienced',
        'Strong independent engineer delivering complex changes across services or products.',
        {
          priority: 110,
          eligibilityNote: 'Experienced software engineer band — commercial delivery expected.',
        }
      ),
      r(
        'Applications Software Specialist',
        'experienced',
        'Specialist contributor deep in application domains, integrations or legacy modernisation.',
        {
          priority: 120,
          roleCategory: 'technical_specialist',
          eligibilityNote: 'Application specialist — not Architect/Specialist stage architecture roles.',
        }
      ),
      r(
        'Senior Software Developer',
        'senior',
        'Senior IC owning complex delivery, design input and mentoring within a software team.',
        {
          priority: 130,
          eligibilityNote:
            'Senior software developer — not automatic from Master’s; experience-led.',
        }
      ),
      r(
        'Senior Software Engineer',
        'senior',
        'Senior engineer driving quality, technical decisions and delivery on significant workstreams.',
        {
          priority: 140,
          eligibilityNote: 'Senior software engineer — broad product/engineering ownership.',
        }
      ),
      r(
        'Staff Software Engineer',
        'senior',
        'High-impact IC influencing design and standards across multiple teams or products.',
        {
          priority: 150,
          seniorityLevel: 'principal',
          eligibilityNote: 'Staff-level software IC — not people-manager track.',
        }
      ),
      r(
        'Lead Software Developer',
        'lead_principal',
        'Leads a delivery squad technically — planning, mentoring and owning outcomes.',
        {
          priority: 160,
          eligibilityNote: 'Technical lead for software teams — not Engineering Manager.',
        }
      ),
      r(
        'Principal Software Engineer',
        'lead_principal',
        'Principal IC setting technical direction and raising engineering practice.',
        {
          priority: 170,
          eligibilityNote: 'Principal software engineer — deep IC leadership.',
        }
      ),
      r(
        'Software Development Team Lead',
        'lead_principal',
        'Leads a software team’s technical delivery and day-to-day engineering practices.',
        {
          priority: 180,
          eligibilityNote: 'Team lead for software development — may be IC or hybrid.',
        }
      ),
      r(
        'Software Solutions Architect',
        'architect_specialist',
        'Designs software solution architectures spanning applications, integrations and quality attributes.',
        {
          priority: 190,
          eligibilityNote:
            'Software architecture — not Frontend Platform Architect or Backend API Architect alone.',
        }
      ),
      r(
        'Application Software Architect',
        'architect_specialist',
        'Owns application-level architecture, patterns and technical standards for product suites.',
        {
          priority: 200,
          eligibilityNote: 'Application architecture within software development specialism.',
        }
      ),
      r(
        'Software Development Manager',
        'manager_head',
        'Manages software engineers — hiring, performance, delivery and stakeholder management.',
        {
          priority: 210,
          eligibilityNote: 'People manager for software — not Architect track.',
        }
      ),
      r(
        'Software Engineering Manager',
        'manager_head',
        'Engineering manager responsible for team health, roadmap delivery and quality outcomes.',
        {
          priority: 220,
          eligibilityNote: 'Engineering management for software teams.',
        }
      ),
      r(
        'Head of Software Development',
        'manager_head',
        'Heads software development capability across multiple teams or products.',
        {
          priority: 230,
          eligibilityNote: 'Head of function — not Director/Executive board-level remit alone.',
        }
      ),
      r(
        'Director of Software Engineering',
        'director_executive',
        'Director-level leadership of software engineering strategy, investment and multi-team delivery.',
        {
          priority: 240,
          eligibilityNote: 'Future progression — extensive leadership experience required.',
          fitClassification: 'future_progression',
        }
      ),
      r(
        'VP of Software Development',
        'director_executive',
        'Executive ownership of software development organisations, portfolios and engineering culture.',
        {
          priority: 250,
          eligibilityNote: 'Executive software leadership — future progression only.',
          fitClassification: 'future_progression',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Full Stack Development
  // -------------------------------------------------------------------------
  {
    slug: 'full-stack-development',
    label: 'Full Stack Development',
    professionalBody: BCS,
    relatedBodies: ['AWS', 'Microsoft', 'Node.js Foundation'],
    sources: [...SOURCES, 'mdn_web_docs_careers'],
    siblingSlugs: siblings('full-stack-development'),
    roles: [
      r(
        'Full Stack Development Apprentice',
        'entry_trainee',
        'Apprenticeship covering client and server basics for end-to-end web/product features.',
        {
          priority: 10,
          eligibilityNote: 'Full stack apprentice — not Frontend-only or Backend-only apprenticeships.',
        }
      ),
      r(
        'Trainee Full Stack Developer',
        'entry_trainee',
        'Trainee building simple end-to-end features across UI and API under supervision.',
        {
          priority: 20,
          eligibilityNote: 'Full stack trainee pathway — portfolio valued.',
        }
      ),
      r(
        'Graduate Full Stack Developer',
        'entry_trainee',
        'Graduate entry delivering small full-stack stories with mentoring across the stack.',
        {
          priority: 30,
          roleCategory: 'graduate_entry',
          academicRequirement: 'degree_relevant',
          eligibilityNote: 'Graduate full stack — degree optional at many UK employers.',
        }
      ),
      r(
        'Junior Full Stack Developer',
        'junior',
        'Early-career full stack developer shipping supervised features across UI and services.',
        {
          priority: 40,
          eligibilityNote: 'Junior full stack — not Junior Frontend or Junior Backend alone.',
        }
      ),
      r(
        'Associate Full Stack Engineer',
        'junior',
        'Associate engineer contributing thin vertical slices with guidance on both ends of the stack.',
        {
          priority: 50,
          eligibilityNote: 'Associate full stack engineer role.',
        }
      ),
      r(
        'Junior Full Stack Web Developer',
        'junior',
        'Junior web-focused full stack role on browser UI plus server/API work.',
        {
          priority: 60,
          eligibilityNote: 'Web-oriented junior full stack — still end-to-end ownership expected.',
        }
      ),
      r(
        'Full Stack Developer',
        'practitioner',
        'Independent delivery of product features across client, API and data access layers.',
        {
          priority: 70,
          eligibilityNote: 'Core full stack practitioner — not Frontend Developer or Backend Developer.',
        }
      ),
      r(
        'Full Stack Engineer',
        'practitioner',
        'Engineer owning vertical slices from UI through services with testing and deployment awareness.',
        {
          priority: 80,
          eligibilityNote: 'Full stack engineer — end-to-end product delivery.',
        }
      ),
      r(
        'Full Stack Application Developer',
        'practitioner',
        'Builds full-stack applications for business products with balanced front and back skills.',
        {
          priority: 90,
          eligibilityNote: 'Application-focused full stack practitioner.',
        }
      ),
      r(
        'Mid-Level Full Stack Developer',
        'experienced',
        'Experienced full stack developer owning non-trivial features and cross-cutting concerns.',
        {
          priority: 100,
          eligibilityNote: 'Experienced full stack — commercial delivery across the stack.',
        }
      ),
      r(
        'Full Stack Product Engineer',
        'experienced',
        'Product-minded full stack engineer shaping UX and API design within a product team.',
        {
          priority: 110,
          eligibilityNote: 'Product engineering with full stack remit.',
        }
      ),
      r(
        'Full Stack Platform Developer',
        'experienced',
        'Experienced developer building reusable full-stack capabilities and internal platforms.',
        {
          priority: 120,
          roleCategory: 'technical_specialist',
          eligibilityNote: 'Platform-oriented full stack — not Solutions Architect stage.',
        }
      ),
      r(
        'Senior Full Stack Developer',
        'senior',
        'Senior full stack IC owning complex end-to-end features and mentoring across the stack.',
        {
          priority: 130,
          eligibilityNote: 'Senior full stack — experience-led, not degree-led seniority.',
        }
      ),
      r(
        'Senior Full Stack Engineer',
        'senior',
        'Senior engineer driving quality and design of multi-layer product features.',
        {
          priority: 140,
          eligibilityNote: 'Senior full stack engineer.',
        }
      ),
      r(
        'Staff Full Stack Engineer',
        'senior',
        'Staff-level full stack IC influencing architecture and standards across squads.',
        {
          priority: 150,
          seniorityLevel: 'principal',
          eligibilityNote: 'Staff full stack IC — not people manager.',
        }
      ),
      r(
        'Lead Full Stack Developer',
        'lead_principal',
        'Technical lead for full stack delivery teams owning planning and mentoring.',
        {
          priority: 160,
          eligibilityNote: 'Full stack technical lead.',
        }
      ),
      r(
        'Principal Full Stack Engineer',
        'lead_principal',
        'Principal IC setting full-stack technical direction and raising engineering practice.',
        {
          priority: 170,
          eligibilityNote: 'Principal full stack engineer.',
        }
      ),
      r(
        'Full Stack Development Team Lead',
        'lead_principal',
        'Leads a full stack team’s delivery practices and technical outcomes.',
        {
          priority: 180,
          eligibilityNote: 'Team lead for full stack development.',
        }
      ),
      r(
        'Full Stack Solutions Architect',
        'architect_specialist',
        'Designs end-to-end solution architectures spanning client, services and data for products.',
        {
          priority: 190,
          eligibilityNote:
            'Full stack solutions architecture — not Frontend Platform or Backend Platform alone.',
        }
      ),
      r(
        'Full Stack Platform Architect',
        'architect_specialist',
        'Architects shared full-stack platforms, conventions and developer experience tooling.',
        {
          priority: 200,
          eligibilityNote: 'Full stack platform architecture.',
        }
      ),
      r(
        'Full Stack Development Manager',
        'manager_head',
        'Manages full stack engineering teams — delivery, hiring and performance.',
        {
          priority: 210,
          eligibilityNote: 'People manager for full stack teams.',
        }
      ),
      r(
        'Full Stack Engineering Manager',
        'manager_head',
        'Engineering manager for product squads with full stack delivery remits.',
        {
          priority: 220,
          eligibilityNote: 'Engineering management — full stack context.',
        }
      ),
      r(
        'Head of Full Stack Development',
        'manager_head',
        'Heads full stack development capability across products or business units.',
        {
          priority: 230,
          eligibilityNote: 'Head of full stack development.',
        }
      ),
      r(
        'Director of Full Stack Engineering',
        'director_executive',
        'Director-level leadership of full stack engineering strategy and multi-team portfolios.',
        {
          priority: 240,
          eligibilityNote: 'Future progression — extensive leadership required.',
          fitClassification: 'future_progression',
        }
      ),
      r(
        'VP of Full Stack Development',
        'director_executive',
        'Executive ownership of full stack development organisations and product engineering culture.',
        {
          priority: 250,
          eligibilityNote: 'Executive full stack leadership — future progression only.',
          fitClassification: 'future_progression',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Frontend Development
  // -------------------------------------------------------------------------
  {
    slug: 'frontend-development',
    label: 'Frontend Development',
    professionalBody: BCS,
    relatedBodies: ['W3C', 'Mozilla', 'Google'],
    sources: [...SOURCES, 'mdn_web_docs_careers', 'frontend_developer_roadmap'],
    siblingSlugs: siblings('frontend-development'),
    roles: [
      r(
        'Frontend Development Apprentice',
        'entry_trainee',
        'Apprenticeship focused on HTML, CSS, JavaScript and accessible UI under supervision.',
        {
          priority: 10,
          eligibilityNote: 'Frontend apprentice — not Full Stack or Backend apprenticeships.',
        }
      ),
      r(
        'Trainee Frontend Developer',
        'entry_trainee',
        'Trainee building UI components and pages with mentoring on modern frontend tooling.',
        {
          priority: 20,
          eligibilityNote: 'Frontend trainee — portfolio and practical skills valued.',
        }
      ),
      r(
        'Graduate Frontend Developer',
        'entry_trainee',
        'Graduate entry implementing UI features with accessibility and responsive design basics.',
        {
          priority: 30,
          roleCategory: 'graduate_entry',
          academicRequirement: 'degree_relevant',
          eligibilityNote: 'Graduate frontend — degree optional for many UK roles.',
        }
      ),
      r(
        'Junior Frontend Developer',
        'junior',
        'Early-career frontend developer shipping UI changes with code review.',
        {
          priority: 40,
          eligibilityNote: 'Junior frontend — not Junior Full Stack or Junior Web generalist alone.',
        }
      ),
      r(
        'Associate Frontend Engineer',
        'junior',
        'Associate engineer contributing to component libraries and product UI with guidance.',
        {
          priority: 50,
          eligibilityNote: 'Associate frontend engineer.',
        }
      ),
      r(
        'Junior UI Developer',
        'junior',
        'Junior role implementing interfaces from design systems with focus on pixel craft and a11y.',
        {
          priority: 60,
          eligibilityNote: 'UI-focused junior frontend pathway.',
        }
      ),
      r(
        'Frontend Developer',
        'practitioner',
        'Independent frontend delivery of product interfaces, state and client performance.',
        {
          priority: 70,
          eligibilityNote: 'Core frontend practitioner — not Full Stack Developer.',
        }
      ),
      r(
        'Frontend Engineer',
        'practitioner',
        'Engineer building client-side applications with testing, accessibility and UX collaboration.',
        {
          priority: 80,
          eligibilityNote: 'Frontend engineer — client-side ownership.',
        }
      ),
      r(
        'React Frontend Developer',
        'practitioner',
        'Frontend developer specialising in React-based product UIs and component systems.',
        {
          priority: 90,
          roleCategory: 'technical_specialist',
          eligibilityNote: 'React-focused frontend practitioner — still frontend specialism.',
        }
      ),
      r(
        'Mid-Level Frontend Developer',
        'experienced',
        'Experienced frontend developer owning complex UI domains and mentoring juniors.',
        {
          priority: 100,
          eligibilityNote: 'Experienced frontend — commercial UI delivery.',
        }
      ),
      r(
        'UI Engineer (Frontend)',
        'experienced',
        'Strong UI engineer focusing on design systems, interaction quality and front-end craft.',
        {
          priority: 110,
          roleCategory: 'design',
          eligibilityNote: 'UI engineering within frontend — not visual design-only roles.',
        }
      ),
      r(
        'Frontend Performance Specialist',
        'experienced',
        'Specialist improving Core Web Vitals, bundle size and client runtime performance.',
        {
          priority: 120,
          roleCategory: 'technical_specialist',
          eligibilityNote: 'Frontend performance specialist — experienced band.',
        }
      ),
      r(
        'Senior Frontend Developer',
        'senior',
        'Senior frontend IC owning complex UI areas, accessibility and mentoring.',
        {
          priority: 130,
          eligibilityNote: 'Senior frontend — experience-led seniority.',
        }
      ),
      r(
        'Senior Frontend Engineer',
        'senior',
        'Senior engineer driving frontend architecture decisions within product teams.',
        {
          priority: 140,
          eligibilityNote: 'Senior frontend engineer.',
        }
      ),
      r(
        'Staff Frontend Engineer',
        'senior',
        'Staff-level frontend IC influencing UI architecture and standards across teams.',
        {
          priority: 150,
          seniorityLevel: 'principal',
          eligibilityNote: 'Staff frontend IC — not people manager.',
        }
      ),
      r(
        'Lead Frontend Developer',
        'lead_principal',
        'Technical lead for frontend teams owning delivery quality and mentoring.',
        {
          priority: 160,
          eligibilityNote: 'Frontend technical lead.',
        }
      ),
      r(
        'Principal Frontend Engineer',
        'lead_principal',
        'Principal IC setting frontend technical direction and design-system strategy.',
        {
          priority: 170,
          eligibilityNote: 'Principal frontend engineer.',
        }
      ),
      r(
        'Frontend Development Team Lead',
        'lead_principal',
        'Leads a frontend team’s engineering practices and delivery outcomes.',
        {
          priority: 180,
          eligibilityNote: 'Team lead for frontend development.',
        }
      ),
      r(
        'Frontend Solutions Architect',
        'architect_specialist',
        'Designs frontend solution architectures, micro-frontends and client integration patterns.',
        {
          priority: 190,
          eligibilityNote: 'Frontend architecture — not Full Stack or Backend architecture.',
        }
      ),
      r(
        'Frontend Platform Architect',
        'architect_specialist',
        'Architects frontend platforms, design systems and developer experience for UI teams.',
        {
          priority: 200,
          eligibilityNote: 'Frontend platform architecture.',
        }
      ),
      r(
        'Frontend Development Manager',
        'manager_head',
        'Manages frontend engineers — hiring, delivery and quality of client experiences.',
        {
          priority: 210,
          eligibilityNote: 'People manager for frontend teams.',
        }
      ),
      r(
        'Frontend Engineering Manager',
        'manager_head',
        'Engineering manager for product UI teams with frontend delivery remits.',
        {
          priority: 220,
          eligibilityNote: 'Engineering management — frontend context.',
        }
      ),
      r(
        'Head of Frontend Development',
        'manager_head',
        'Heads frontend development capability across products or brands.',
        {
          priority: 230,
          eligibilityNote: 'Head of frontend development.',
        }
      ),
      r(
        'Director of Frontend Engineering',
        'director_executive',
        'Director-level leadership of frontend engineering strategy and multi-team UI delivery.',
        {
          priority: 240,
          eligibilityNote: 'Future progression — extensive leadership required.',
          fitClassification: 'future_progression',
        }
      ),
      r(
        'VP of Frontend Development',
        'director_executive',
        'Executive ownership of frontend organisations, design-system investment and UX engineering.',
        {
          priority: 250,
          eligibilityNote: 'Executive frontend leadership — future progression only.',
          fitClassification: 'future_progression',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Backend Development
  // -------------------------------------------------------------------------
  {
    slug: 'backend-development',
    label: 'Backend Development',
    professionalBody: BCS,
    relatedBodies: ['AWS', 'Microsoft', 'CNCF'],
    sources: [...SOURCES, 'owasp_secure_coding'],
    siblingSlugs: siblings('backend-development'),
    roles: [
      r(
        'Backend Development Apprentice',
        'entry_trainee',
        'Apprenticeship focused on server-side programming, APIs and data access under supervision.',
        {
          priority: 10,
          eligibilityNote: 'Backend apprentice — not Frontend or Full Stack apprenticeships.',
        }
      ),
      r(
        'Trainee Backend Developer',
        'entry_trainee',
        'Trainee building simple APIs and services with mentoring on security and testing basics.',
        {
          priority: 20,
          eligibilityNote: 'Backend trainee — practical skills and portfolio valued.',
        }
      ),
      r(
        'Graduate Backend Developer',
        'entry_trainee',
        'Graduate entry implementing service endpoints and data layers with code review.',
        {
          priority: 30,
          roleCategory: 'graduate_entry',
          academicRequirement: 'degree_relevant',
          eligibilityNote: 'Graduate backend — degree optional for many UK employers.',
        }
      ),
      r(
        'Junior Backend Developer',
        'junior',
        'Early-career backend developer delivering supervised API and service changes.',
        {
          priority: 40,
          eligibilityNote: 'Junior backend — not Junior Full Stack or Junior Frontend.',
        }
      ),
      r(
        'Associate Backend Engineer',
        'junior',
        'Associate engineer contributing to services, integrations and data access with guidance.',
        {
          priority: 50,
          eligibilityNote: 'Associate backend engineer.',
        }
      ),
      r(
        'Junior API Developer',
        'junior',
        'Junior role focused on REST/GraphQL endpoints, contracts and basic service testing.',
        {
          priority: 60,
          eligibilityNote: 'API-focused junior backend pathway.',
        }
      ),
      r(
        'Backend Developer',
        'practitioner',
        'Independent delivery of APIs, business logic and data access for products.',
        {
          priority: 70,
          eligibilityNote: 'Core backend practitioner — not Full Stack Developer.',
        }
      ),
      r(
        'Backend Engineer',
        'practitioner',
        'Engineer building reliable services with testing, observability and secure coding practices.',
        {
          priority: 80,
          eligibilityNote: 'Backend engineer — server-side ownership.',
        }
      ),
      r(
        'API Developer',
        'practitioner',
        'Developer specialising in API design, versioning and integration for product teams.',
        {
          priority: 90,
          roleCategory: 'technical_specialist',
          eligibilityNote: 'API developer within backend specialism.',
        }
      ),
      r(
        'Mid-Level Backend Developer',
        'experienced',
        'Experienced backend developer owning complex services and mentoring juniors.',
        {
          priority: 100,
          eligibilityNote: 'Experienced backend — commercial service delivery.',
        }
      ),
      r(
        'Server-Side Engineer (Experienced)',
        'experienced',
        'Strong server-side engineer delivering scalable services and integration work.',
        {
          priority: 110,
          eligibilityNote: 'Experienced server-side engineer band.',
        }
      ),
      r(
        'Backend Integration Specialist',
        'experienced',
        'Specialist in service integrations, messaging and third-party API connectivity.',
        {
          priority: 120,
          roleCategory: 'technical_specialist',
          eligibilityNote: 'Backend integration specialist — experienced band.',
        }
      ),
      r(
        'Senior Backend Developer',
        'senior',
        'Senior backend IC owning complex services, reliability and mentoring.',
        {
          priority: 130,
          eligibilityNote: 'Senior backend — experience-led seniority.',
        }
      ),
      r(
        'Senior Backend Engineer',
        'senior',
        'Senior engineer driving service design, performance and operational quality.',
        {
          priority: 140,
          eligibilityNote: 'Senior backend engineer.',
        }
      ),
      r(
        'Staff Backend Engineer',
        'senior',
        'Staff-level backend IC influencing service architecture and standards across teams.',
        {
          priority: 150,
          seniorityLevel: 'principal',
          eligibilityNote: 'Staff backend IC — not people manager.',
        }
      ),
      r(
        'Lead Backend Developer',
        'lead_principal',
        'Technical lead for backend teams owning delivery quality and mentoring.',
        {
          priority: 160,
          eligibilityNote: 'Backend technical lead.',
        }
      ),
      r(
        'Principal Backend Engineer',
        'lead_principal',
        'Principal IC setting backend technical direction and platform practices.',
        {
          priority: 170,
          eligibilityNote: 'Principal backend engineer.',
        }
      ),
      r(
        'Backend Development Team Lead',
        'lead_principal',
        'Leads a backend team’s engineering practices and service delivery outcomes.',
        {
          priority: 180,
          eligibilityNote: 'Team lead for backend development.',
        }
      ),
      r(
        'Backend Solutions Architect',
        'architect_specialist',
        'Designs backend solution architectures spanning services, data and integrations.',
        {
          priority: 190,
          eligibilityNote: 'Backend architecture — not Frontend or Full Stack architecture alone.',
        }
      ),
      r(
        'Backend Platform Architect',
        'architect_specialist',
        'Architects shared backend platforms, service templates and operational standards.',
        {
          priority: 200,
          eligibilityNote: 'Backend platform architecture.',
        }
      ),
      r(
        'Enterprise API Architect',
        'architect_specialist',
        'Architects enterprise API strategies, gateways and cross-domain service contracts.',
        {
          priority: 210,
          eligibilityNote: 'API architecture within backend specialism.',
        }
      ),
      r(
        'Backend Development Manager',
        'manager_head',
        'Manages backend engineers — hiring, delivery and service quality.',
        {
          priority: 220,
          eligibilityNote: 'People manager for backend teams.',
        }
      ),
      r(
        'Backend Engineering Manager',
        'manager_head',
        'Engineering manager for service/platform teams with backend delivery remits.',
        {
          priority: 230,
          eligibilityNote: 'Engineering management — backend context.',
        }
      ),
      r(
        'Head of Backend Development',
        'manager_head',
        'Heads backend development capability across products or platforms.',
        {
          priority: 240,
          eligibilityNote: 'Head of backend development.',
        }
      ),
      r(
        'Director of Backend Engineering',
        'director_executive',
        'Director-level leadership of backend engineering strategy and multi-team service portfolios.',
        {
          priority: 250,
          eligibilityNote: 'Future progression — extensive leadership required.',
          fitClassification: 'future_progression',
        }
      ),
      r(
        'VP of Backend Development',
        'director_executive',
        'Executive ownership of backend organisations, platform investment and reliability culture.',
        {
          priority: 260,
          eligibilityNote: 'Executive backend leadership — future progression only.',
          fitClassification: 'future_progression',
        }
      ),
    ],
  },
]
