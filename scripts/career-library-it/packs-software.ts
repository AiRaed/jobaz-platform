/**
 * IT Career Knowledge Library — Software development family specialism packs.
 * Experience-level stage model (entry → director). No academic_research roles.
 */

import { r, type SpecialismPack } from './shared'

const SOFTWARE_SIBLINGS = [
  'web-development',
  'mobile-development',
  'full-stack-development',
  'frontend-development',
  'backend-development',
] as const

const WEB_SIBLINGS = [
  'software-development',
  'mobile-development',
  'full-stack-development',
  'frontend-development',
  'backend-development',
] as const

const MOBILE_SIBLINGS = [
  'software-development',
  'web-development',
  'full-stack-development',
  'frontend-development',
  'backend-development',
] as const

const FULL_STACK_SIBLINGS = [
  'software-development',
  'web-development',
  'mobile-development',
  'frontend-development',
  'backend-development',
] as const

const FRONTEND_SIBLINGS = [
  'software-development',
  'web-development',
  'mobile-development',
  'full-stack-development',
  'backend-development',
] as const

const BACKEND_SIBLINGS = [
  'software-development',
  'web-development',
  'mobile-development',
  'full-stack-development',
  'frontend-development',
] as const

const BASE_SOURCES = [
  'prospects_software_developer',
  'national_careers_service_software_developer',
  'bcs_careers',
  'tech_nation_skills',
]

export const SOFTWARE_PACKS: SpecialismPack[] = [
  {
    slug: 'software-development',
    label: 'Software Development',
    professionalBody: 'BCS, The Chartered Institute for IT',
    relatedBodies: ['CompTIA', 'AWS', 'Microsoft', 'Oracle'],
    sources: [...BASE_SOURCES, 'govuk_digital_data_technology'],
    siblingSlugs: [...SOFTWARE_SIBLINGS],
    roles: [
      r('Software Development Apprentice', 'entry_trainee', 'Level 3–4 digital/software apprenticeship delivering coding, testing and support tasks under supervision in UK employers.', {
        priority: 10,
        eligibilityNote:
          'General software development entry — not Web-only, Mobile, Frontend, Backend or Full Stack specialisms.',
      }),
      r('Trainee Software Developer', 'entry_trainee', 'Structured trainee role building foundational programming skills on internal systems or products with mentoring.', {
        priority: 20,
        eligibilityNote:
          'Broad software trainee pathway — distinct from web, mobile or stack-specific trainee titles.',
      }),
      r('Graduate Software Developer', 'entry_trainee', 'Graduate scheme or first hire writing and maintaining application code across languages and platforms.', {
        priority: 30,
        eligibilityNote:
          'General graduate software role — not Frontend, Backend, Web or Mobile graduate titles.',
      }),
      r('Entry-Level Application Programmer', 'entry_trainee', 'Writes small modules and fixes bugs in business applications; portfolio or bootcamp entry common in UK.', {
        priority: 40,
        eligibilityNote:
          'Application programming focus within general software — not server/API-only Backend roles.',
      }),
      r('Junior Software Developer', 'junior', 'Delivers features and defect fixes on assigned components with code review and pair programming.', {
        priority: 50,
        eligibilityNote:
          'Junior general software delivery — not Junior Web, Mobile, Frontend or Backend developer titles.',
      }),
      r('Associate Software Engineer', 'junior', 'Early-career engineer contributing to design discussions and unit tests on product teams.', {
        priority: 60,
        eligibilityNote:
          'Associate software engineer (general) — distinct from stack-specific associate titles.',
      }),
      r('Software Developer (Junior Grade)', 'junior', 'UK employer grade for developers with 1–2 years building CRUD, integrations and internal tools.', {
        priority: 70,
        eligibilityNote:
          'Graded junior software developer — not web or mobile-specific junior grades.',
      }),
      r('Junior Application Programmer', 'junior', 'Maintains legacy and line-of-business applications; often COBOL, Java or .NET in UK enterprises.', {
        priority: 80,
        eligibilityNote:
          'Application programmer junior track — not API/backend-only or UI/frontend-only roles.',
      }),
      r('Software Developer', 'practitioner', 'Independently delivers user stories across the stack areas assigned by team structure.', {
        priority: 90,
        eligibilityNote:
          'Mid-level general software developer — team may span layers but role is not Full Stack, Frontend or Backend specialism.',
      }),
      r('Software Engineer', 'practitioner', 'Designs and implements reliable modules, participates in agile ceremonies and technical debt reduction.', {
        priority: 100,
        eligibilityNote:
          'Software engineer (general) — not Web Engineer, Mobile Engineer or Full Stack Engineer titles.',
      }),
      r('Application Developer', 'practitioner', 'Builds and enhances business applications, integrations and reporting for UK corporate clients.', {
        priority: 110,
        eligibilityNote:
          'Application development mid-level — distinct from Web Application Developer or Mobile App Developer.',
      }),
      r('Software Programmer', 'practitioner', 'Hands-on coding on established codebases; strong debugging and version control expected.', {
        priority: 120,
        eligibilityNote:
          'Programmer role within general software — not web-only or backend-only programmer titles.',
      }),
      r('Mid-Level Software Developer', 'practitioner', 'Owns medium-complexity epics, mentors juniors informally and improves CI/build pipelines.', {
        priority: 130,
        eligibilityNote:
          'Explicit mid-grade software developer — not Mid-Level Web, Frontend or Backend variants.',
      }),
      r('Senior Software Developer', 'senior', 'Leads delivery of complex features, sets coding standards and performs in-depth code reviews.', {
        priority: 150,
        eligibilityNote:
          'Senior general software — not Senior Web, Mobile, Frontend, Backend or Full Stack developer titles.',
      }),
      r('Senior Software Engineer', 'senior', 'Technical authority on subsystems; drives refactoring, performance and observability improvements.', {
        priority: 160,
        eligibilityNote:
          'Senior software engineer (general) — distinct from stack-specific senior engineer titles.',
      }),
      r('Senior Application Developer', 'senior', 'Owns critical business applications and release cycles for enterprise UK deployments.', {
        priority: 170,
        eligibilityNote:
          'Senior application developer — not Senior Web Application or Mobile App developer roles.',
      }),
      r('Senior Software Programmer', 'senior', 'Deep expertise maintaining and modernising large legacy codebases under architectural guidance.', {
        priority: 180,
        eligibilityNote:
          'Senior programmer (general software) — not web or backend-only senior programmer titles.',
      }),
      r('Staff Software Engineer', 'senior', 'Org-wide technical influence; unblocks hard problems and defines engineering practices.', {
        priority: 190,
        eligibilityNote:
          'Staff-level general software IC — not Staff Web, Mobile, Frontend or Backend engineer titles.',
      }),
      r('Lead Software Developer', 'lead_principal', 'Leads a squad’s technical direction while still contributing significant code.', {
        priority: 210,
        eligibilityNote:
          'Lead software developer (general) — not Lead Web, Mobile, Frontend, Backend or Full Stack leads.',
      }),
      r('Software Development Team Lead', 'lead_principal', 'Coordinates sprint delivery, technical decisions and mentoring for a software team.', {
        priority: 220,
        eligibilityNote:
          'Team lead for general software teams — distinct from Web or Mobile development team leads.',
      }),
      r('Principal Software Engineer', 'lead_principal', 'Sets technical strategy for a product area; balances build vs buy and long-term maintainability.', {
        priority: 230,
        eligibilityNote:
          'Principal engineer (general software) — not Principal Web, Mobile or Full Stack engineer titles.',
      }),
      r('Software Solutions Architect', 'architect_specialist', 'Designs end-to-end application solutions aligning business requirements with technical constraints.', {
        priority: 240,
        roleCategory: 'design',
        eligibilityNote:
          'Solution architecture for general software — not Web Platform, Mobile Platform or API-only architects.',
      }),
      r('Application Software Architect', 'architect_specialist', 'Defines application layering, integration patterns and non-functional requirements for UK systems.', {
        priority: 250,
        roleCategory: 'design',
        eligibilityNote:
          'Application architecture within software development — not Frontend UI or Backend platform-only architects.',
      }),
      r('Enterprise Software Architect', 'architect_specialist', 'Governs software standards, reference architectures and vendor selection at enterprise scale.', {
        priority: 260,
        roleCategory: 'design',
        eligibilityNote:
          'Enterprise software architect (general) — spans more than a single Web, Mobile or stack layer.',
      }),
      r('Software Development Manager', 'manager_head', 'Line manager for software developers; hiring, performance and delivery accountability.', {
        priority: 270,
        roleCategory: 'leadership',
        eligibilityNote:
          'People manager for general software teams — not Web, Mobile, Frontend or Backend-only managers.',
      }),
      r('Head of Software Development', 'manager_head', 'Leads multiple software teams or a department; budget and roadmap ownership.', {
        priority: 280,
        roleCategory: 'leadership',
        eligibilityNote:
          'Head of general software development — distinct from Head of Web or Mobile development.',
      }),
      r('Software Engineering Manager', 'manager_head', 'Balances people leadership with enough technical credibility to guide architecture choices.', {
        priority: 290,
        roleCategory: 'leadership',
        eligibilityNote:
          'Engineering manager (software, general) — not Full Stack or Frontend engineering manager titles.',
      }),
      r('Director of Software Engineering', 'director_executive', 'Senior leader owning software engineering organisation, strategy and vendor partnerships.', {
        priority: 300,
        roleCategory: 'leadership',
        eligibilityNote:
          'Director-level general software leadership — not Director of Web, Mobile or Backend Engineering.',
      }),
      r('VP of Software Development', 'director_executive', 'Executive accountable for software delivery portfolios across products or business units in UK HQ.', {
        priority: 310,
        roleCategory: 'leadership',
        eligibilityNote:
          'VP software development (general) — executive scope beyond a single stack specialism.',
      }),
    ],
  },
  {
    slug: 'web-development',
    label: 'Web Development',
    professionalBody: 'BCS, The Chartered Institute for IT',
    relatedBodies: ['W3C', 'MDN Web Docs', 'Google Developers', 'Microsoft'],
    sources: [...BASE_SOURCES, 'mdn_web_development', 'w3c_standards'],
    siblingSlugs: [...WEB_SIBLINGS],
    roles: [
      r('Web Development Apprentice', 'entry_trainee', 'Apprenticeship focused on HTML, CSS, JavaScript and accessible website delivery for UK clients.', {
        priority: 10,
        eligibilityNote:
          'Web development entry — browser and HTTP focus; not general Software, Mobile native or Backend-only roles.',
      }),
      r('Trainee Web Developer', 'entry_trainee', 'Builds static and dynamic web pages under supervision; learns responsive design and CMS basics.', {
        priority: 20,
        eligibilityNote:
          'Trainee web developer — distinct from Trainee Software or Mobile Developer titles.',
      }),
      r('Graduate Web Developer', 'entry_trainee', 'First web-focused role on marketing sites, SPAs or internal portals after degree or bootcamp.', {
        priority: 30,
        eligibilityNote:
          'Graduate web pathway — not Graduate Software, Frontend-only or Full Stack graduate titles.',
      }),
      r('Entry-Level Web Programmer', 'entry_trainee', 'Implements page templates, forms and client-side scripts for UK agency or in-house web teams.', {
        priority: 40,
        eligibilityNote:
          'Web programmer entry — HTTP/browser delivery; not server-side Backend-only entry roles.',
      }),
      r('Junior Web Developer', 'junior', 'Maintains websites and small web apps; fixes cross-browser issues and CMS content.', {
        priority: 50,
        eligibilityNote:
          'Junior web developer — whole-site web delivery; not Junior Frontend-only or Backend API roles.',
      }),
      r('Associate Web Engineer', 'junior', 'Contributes to component libraries and REST consumption for browser-based products.', {
        priority: 60,
        eligibilityNote:
          'Associate web engineer — web stack breadth; not Associate Software or Mobile Engineer titles.',
      }),
      r('Frontend Web Developer (Junior)', 'junior', 'Junior role emphasising HTML/CSS/JS for public websites rather than deep UI framework specialism.', {
        priority: 70,
        eligibilityNote:
          'Junior web-frontend hybrid — still Web specialism, not pure Frontend React/UI specialism or Backend.',
      }),
      r('Junior HTML/CSS Developer', 'junior', 'Specialises early-career in markup, styling and accessibility for marketing and content sites.', {
        priority: 80,
        eligibilityNote:
          'Junior markup/CSS focus within web development — not Junior Frontend React Developer titles.',
      }),
      r('Web Developer', 'practitioner', 'Delivers full website features including routing, templating and integration with web APIs.', {
        priority: 90,
        eligibilityNote:
          'Mid-level web developer — browser-facing delivery; not Mid-Level Backend or Mobile developer.',
      }),
      r('Web Engineer', 'practitioner', 'Engineers performant web applications with modern JS tooling, bundlers and deployment pipelines.', {
        priority: 100,
        eligibilityNote:
          'Web engineer (mid) — distinct from Software Engineer or Full Stack Engineer titles.',
      }),
      r('Website Developer', 'practitioner', 'Builds and maintains corporate, e-commerce and campaign websites for UK organisations.', {
        priority: 110,
        eligibilityNote:
          'Website developer — content and marketing site focus; not native Mobile App Developer roles.',
      }),
      r('Web Application Developer', 'practitioner', 'Develops browser-based business applications with authentication and data visualisation.', {
        priority: 120,
        eligibilityNote:
          'Web application developer — not Application Developer (general software) or Backend API-only roles.',
      }),
      r('Mid-Level Web Developer', 'practitioner', 'Owns web epics, SEO/performance tuning and deployment to UK cloud hosting.', {
        priority: 130,
        eligibilityNote:
          'Mid-level web developer grade — not Mid-Level Frontend or Full Stack developer titles.',
      }),
      r('Senior Web Developer', 'senior', 'Leads complex web builds, accessibility audits and technical choices for web stacks.', {
        priority: 150,
        eligibilityNote:
          'Senior web developer — not Senior Frontend, Backend or Full Stack developer titles.',
      }),
      r('Senior Web Engineer', 'senior', 'Drives web platform reliability, caching strategies and front-to-middle-tier web integration.', {
        priority: 160,
        eligibilityNote:
          'Senior web engineer — web delivery authority; not Senior Software or Mobile Engineer titles.',
      }),
      r('Senior Website Developer', 'senior', 'Owns large website estates, migrations and governance for UK public-sector or retail clients.', {
        priority: 170,
        eligibilityNote:
          'Senior website developer — CMS and content web focus; not Senior UI/Frontend-only roles.',
      }),
      r('Senior Web Application Developer', 'senior', 'Architects multi-tenant web apps, auth flows and progressive enhancement patterns.', {
        priority: 180,
        eligibilityNote:
          'Senior web application developer — not Senior Application Developer (general software).',
      }),
      r('Staff Web Engineer', 'senior', 'Org-level web standards, design systems for web and performance budgets across teams.', {
        priority: 190,
        eligibilityNote:
          'Staff web engineer — not Staff Software, Frontend or Backend engineer titles.',
      }),
      r('Lead Web Developer', 'lead_principal', 'Technical lead for web squads shipping customer-facing sites and portals.', {
        priority: 210,
        eligibilityNote:
          'Lead web developer — not Lead Frontend, Backend or Full Stack developer titles.',
      }),
      r('Web Development Team Lead', 'lead_principal', 'Leads web developers across agencies or product teams; estimates and quality gates.', {
        priority: 220,
        eligibilityNote:
          'Web development team lead — distinct from Software or Mobile development team leads.',
      }),
      r('Principal Web Engineer', 'lead_principal', 'Principal IC defining web technology roadmap, SSR/SSG strategy and edge delivery.', {
        priority: 230,
        eligibilityNote:
          'Principal web engineer — not Principal Software or Full Stack engineer titles.',
      }),
      r('Web Solutions Architect', 'architect_specialist', 'Designs web solution topology: CDN, hosting, CMS, APIs and security for UK deployments.', {
        priority: 240,
        roleCategory: 'design',
        eligibilityNote:
          'Web solutions architect — browser-centric architecture; not Backend Platform or Mobile architects.',
      }),
      r('Web Platform Architect', 'architect_specialist', 'Owns shared web platform, design tokens and deployment patterns for multiple web products.', {
        priority: 250,
        roleCategory: 'design',
        eligibilityNote:
          'Web platform architect — not Frontend UI Architecture Lead or Enterprise API Architect roles.',
      }),
      r('Enterprise Web Architect', 'architect_specialist', 'Enterprise standards for public websites, intranets and customer portals at scale.', {
        priority: 260,
        roleCategory: 'design',
        eligibilityNote:
          'Enterprise web architect — web channel focus; not Enterprise Software Architect (general).',
      }),
      r('Web Development Manager', 'manager_head', 'Manages web developers and agencies; SLA and accessibility compliance accountability.', {
        priority: 270,
        roleCategory: 'leadership',
        eligibilityNote:
          'Web development manager — not Software, Frontend-only or Backend development managers.',
      }),
      r('Head of Web Development', 'manager_head', 'Department head for web delivery across brands or digital transformation programmes.', {
        priority: 280,
        roleCategory: 'leadership',
        eligibilityNote:
          'Head of web development — distinct from Head of Software or Frontend Development.',
      }),
      r('Web Engineering Manager', 'manager_head', 'Engineering manager for web product teams balancing velocity, SEO and security.', {
        priority: 290,
        roleCategory: 'leadership',
        eligibilityNote:
          'Web engineering manager — not Software Engineering Manager or Full Stack manager titles.',
      }),
      r('Director of Web Development', 'director_executive', 'Director owning web channel strategy, budgets and vendor relationships.', {
        priority: 300,
        roleCategory: 'leadership',
        eligibilityNote:
          'Director of web development — not Director of Software or Frontend Engineering.',
      }),
      r('VP of Web Engineering', 'director_executive', 'Executive leadership for web engineering organisation and digital presence at scale.', {
        priority: 310,
        roleCategory: 'leadership',
        eligibilityNote:
          'VP web engineering — executive web scope; not VP Software or Mobile Development.',
      }),
    ],
  },
  {
    slug: 'mobile-development',
    label: 'Mobile Development',
    professionalBody: 'BCS, The Chartered Institute for IT',
    relatedBodies: ['Apple Developer', 'Google Android', 'React Native', 'Flutter'],
    sources: [...BASE_SOURCES, 'apple_developer_careers', 'android_developers'],
    siblingSlugs: [...MOBILE_SIBLINGS],
    roles: [
      r('Mobile Development Apprentice', 'entry_trainee', 'Apprenticeship building simple iOS/Android or cross-platform apps with supervision.', {
        priority: 10,
        eligibilityNote:
          'Mobile development entry — native/cross-platform apps; not Web, Backend or general Software apprenticeships.',
      }),
      r('Trainee Mobile Developer', 'entry_trainee', 'Learns mobile SDKs, app store guidelines and device testing on supervised tasks.', {
        priority: 20,
        eligibilityNote:
          'Trainee mobile developer — not Trainee Web or Software Developer titles.',
      }),
      r('Graduate Mobile Developer', 'entry_trainee', 'First mobile hire shipping features to App Store / Google Play under code review.', {
        priority: 30,
        eligibilityNote:
          'Graduate mobile pathway — not Graduate Web, Frontend or Full Stack graduate roles.',
      }),
      r('Entry-Level App Developer', 'entry_trainee', 'Builds small mobile features and fixes crashes; portfolio apps common for UK entry.', {
        priority: 40,
        eligibilityNote:
          'Entry app developer (mobile) — device apps; not Web Application Developer or Backend entry roles.',
      }),
      r('Junior Mobile Developer', 'junior', 'Implements UI screens, local storage and API consumption on iOS or Android.', {
        priority: 50,
        eligibilityNote:
          'Junior mobile developer — not Junior Web, Frontend or Backend developer titles.',
      }),
      r('Associate Mobile Engineer', 'junior', 'Early-career mobile engineer on agile squads with CI for mobile builds and TestFlight.', {
        priority: 60,
        eligibilityNote:
          'Associate mobile engineer — distinct from Associate Software or Web Engineer titles.',
      }),
      r('Junior iOS Developer', 'junior', 'Swift/SwiftUI development for iPhone and iPad apps under senior iOS guidance.', {
        priority: 70,
        eligibilityNote:
          'Junior iOS developer — Apple platform; not Junior Android or Web developer roles.',
      }),
      r('Junior Android Developer', 'junior', 'Kotlin/Java Android development for phones, tablets and Wear OS under supervision.', {
        priority: 80,
        eligibilityNote:
          'Junior Android developer — Google platform; not Junior iOS or Frontend React roles.',
      }),
      r('Mobile Developer', 'practitioner', 'Independently delivers mobile features, push notifications and offline sync patterns.', {
        priority: 90,
        eligibilityNote:
          'Mid-level mobile developer — not Mid-Level Web, Frontend or Backend developer titles.',
      }),
      r('Mobile App Developer', 'practitioner', 'End-to-end mobile app delivery including store submission and analytics integration.', {
        priority: 100,
        eligibilityNote:
          'Mobile app developer — device apps; not Web Application Developer or Application Developer (general).',
      }),
      r('iOS Developer', 'practitioner', 'Mid-level iOS specialist for consumer or enterprise apps on Apple platforms.', {
        priority: 110,
        eligibilityNote:
          'Mid iOS developer — Apple ecosystem; not Android Developer or Frontend UI roles.',
      }),
      r('Android Developer', 'practitioner', 'Mid-level Android specialist for Google Play distribution and device fragmentation.', {
        priority: 120,
        eligibilityNote:
          'Mid Android developer — not iOS Developer or Backend Server-Side roles.',
      }),
      r('Cross-Platform Mobile Developer', 'practitioner', 'Builds apps with React Native, Flutter or .NET MAUI for iOS and Android from one codebase.', {
        priority: 130,
        eligibilityNote:
          'Cross-platform mobile — still Mobile specialism; not Full Stack Web or Frontend-only roles.',
      }),
      r('Senior Mobile Developer', 'senior', 'Leads mobile releases, performance profiling and App Store compliance for UK products.', {
        priority: 150,
        eligibilityNote:
          'Senior mobile developer — not Senior Web, Frontend or Backend developer titles.',
      }),
      r('Senior iOS Developer', 'senior', 'Deep iOS architecture, memory management and Apple Human Interface Guidelines ownership.', {
        priority: 160,
        eligibilityNote:
          'Senior iOS developer — not Senior Android or Senior Frontend React roles.',
      }),
      r('Senior Android Developer', 'senior', 'Owns Android modularisation, Gradle pipelines and Google Play policy adherence.', {
        priority: 170,
        eligibilityNote:
          'Senior Android developer — not Senior iOS or Backend API developer roles.',
      }),
      r('Senior Mobile App Engineer', 'senior', 'Senior IC across mobile platforms; defines testing strategy and crash-free session targets.', {
        priority: 180,
        eligibilityNote:
          'Senior mobile app engineer — not Senior Software or Web Application engineer titles.',
      }),
      r('Staff Mobile Engineer', 'senior', 'Org-wide mobile standards, shared SDKs and release train governance.', {
        priority: 190,
        eligibilityNote:
          'Staff mobile engineer — not Staff Software, Web or Frontend engineer titles.',
      }),
      r('Lead Mobile Developer', 'lead_principal', 'Technical lead for mobile squads balancing platform parity and delivery timelines.', {
        priority: 210,
        eligibilityNote:
          'Lead mobile developer — not Lead Web, Frontend or Full Stack developer titles.',
      }),
      r('Mobile Development Team Lead', 'lead_principal', 'Leads mobile developers across iOS/Android workstreams and store releases.', {
        priority: 220,
        eligibilityNote:
          'Mobile development team lead — distinct from Web or Software development team leads.',
      }),
      r('Principal Mobile Engineer', 'lead_principal', 'Principal IC for mobile technology choices, shared components and long-term platform bets.', {
        priority: 230,
        eligibilityNote:
          'Principal mobile engineer — not Principal Software or Web engineer titles.',
      }),
      r('Mobile Solutions Architect', 'architect_specialist', 'Designs mobile solution architecture: offline-first, sync, auth and push for UK apps.', {
        priority: 240,
        roleCategory: 'design',
        eligibilityNote:
          'Mobile solutions architect — device app focus; not Web Solutions or Backend Platform architects.',
      }),
      r('Mobile Platform Architect', 'architect_specialist', 'Owns shared mobile platform, build systems and MDM/enterprise mobile patterns.', {
        priority: 250,
        roleCategory: 'design',
        eligibilityNote:
          'Mobile platform architect — not Web Platform or Frontend Platform architect roles.',
      }),
      r('Enterprise Mobile Architect', 'architect_specialist', 'Enterprise mobile strategy: BYOD, security, app wrapping and store governance.', {
        priority: 260,
        roleCategory: 'design',
        eligibilityNote:
          'Enterprise mobile architect — not Enterprise Web or Software architect titles.',
      }),
      r('Mobile Development Manager', 'manager_head', 'Line manager for mobile developers; hiring and App Store release accountability.', {
        priority: 270,
        roleCategory: 'leadership',
        eligibilityNote:
          'Mobile development manager — not Web, Frontend or Backend development managers.',
      }),
      r('Head of Mobile Development', 'manager_head', 'Heads mobile engineering function across consumer and enterprise app portfolios.', {
        priority: 280,
        roleCategory: 'leadership',
        eligibilityNote:
          'Head of mobile development — distinct from Head of Web or Software Development.',
      }),
      r('Mobile Engineering Manager', 'manager_head', 'Engineering manager for mobile teams with store metrics and platform roadmap input.', {
        priority: 290,
        roleCategory: 'leadership',
        eligibilityNote:
          'Mobile engineering manager — not Software or Web Engineering Manager titles.',
      }),
      r('Director of Mobile Engineering', 'director_executive', 'Director owning mobile strategy, vendor SDK relationships and headcount planning.', {
        priority: 300,
        roleCategory: 'leadership',
        eligibilityNote:
          'Director of mobile engineering — not Director of Web or Software Engineering.',
      }),
      r('VP of Mobile Development', 'director_executive', 'Executive accountable for mobile product engineering and app portfolio P&L.', {
        priority: 310,
        roleCategory: 'leadership',
        eligibilityNote:
          'VP mobile development — executive mobile scope; not VP Web or Software Development.',
      }),
    ],
  },
  {
    slug: 'full-stack-development',
    label: 'Full Stack Development',
    professionalBody: 'BCS, The Chartered Institute for IT',
    relatedBodies: ['AWS', 'Microsoft', 'MongoDB', 'PostgreSQL'],
    sources: [...BASE_SOURCES, 'stack_overflow_developer_survey', 'freecodecamp_full_stack'],
    siblingSlugs: [...FULL_STACK_SIBLINGS],
    roles: [
      r('Full Stack Development Apprentice', 'entry_trainee', 'Apprenticeship spanning front-end pages and back-end APIs on supervised full-stack tasks.', {
        priority: 10,
        eligibilityNote:
          'Full stack entry — deliberate front+back breadth; not Frontend-only, Backend-only or Mobile apprenticeships.',
      }),
      r('Trainee Full Stack Developer', 'entry_trainee', 'Trainee building small CRUD apps end-to-end with mentoring on both tiers.', {
        priority: 20,
        eligibilityNote:
          'Trainee full stack — not Trainee Web-only or Backend-only developer titles.',
      }),
      r('Graduate Full Stack Developer', 'entry_trainee', 'Graduate role delivering features across UI and server layers in startup or product teams.', {
        priority: 30,
        eligibilityNote:
          'Graduate full stack — not Graduate Software, Frontend or Backend graduate titles.',
      }),
      r('Entry-Level Full Stack Programmer', 'entry_trainee', 'Entry programmer touching database, API and UI layers on internal tools.', {
        priority: 40,
        eligibilityNote:
          'Entry full stack programmer — both tiers required; not Entry-Level Web Programmer or Server Developer only.',
      }),
      r('Junior Full Stack Developer', 'junior', 'Junior developer shipping vertical slices from UI through API to database.', {
        priority: 50,
        eligibilityNote:
          'Junior full stack — both front and back; not Junior Frontend or Junior Backend-only roles.',
      }),
      r('Associate Full Stack Engineer', 'junior', 'Associate engineer on product squads owning end-to-end user stories.', {
        priority: 60,
        eligibilityNote:
          'Associate full stack engineer — distinct from Associate Software or Web Engineer titles.',
      }),
      r('Junior Full Stack Web Developer', 'junior', 'Junior role on web stacks (e.g. React + Node) delivering browser and server code.', {
        priority: 70,
        eligibilityNote:
          'Junior full stack web — web stack breadth; not Junior Web-only or Frontend-only junior titles.',
      }),
      r('Full Stack Developer (Junior Grade)', 'junior', 'Employer junior grade explicitly requiring UI and API competency together.', {
        priority: 80,
        eligibilityNote:
          'Graded junior full stack — not Software Developer (Junior Grade) or Backend-only junior grades.',
      }),
      r('Full Stack Developer', 'practitioner', 'Mid-level IC owning features across client, server and data persistence layers.', {
        priority: 90,
        eligibilityNote:
          'Mid full stack developer — intentional dual-tier ownership; not Mid-Level Frontend or Backend-only.',
      }),
      r('Full Stack Engineer', 'practitioner', 'Engineers scalable full-stack features with testing across UI and service boundaries.', {
        priority: 100,
        eligibilityNote:
          'Full stack engineer (mid) — not Software Engineer or Web Engineer without stack breadth.',
      }),
      r('Full Stack Web Developer', 'practitioner', 'Web-focused full stack: SPA front ends with Node, .NET or Java back ends.', {
        priority: 110,
        eligibilityNote:
          'Full stack web developer — both web tiers; not Website Developer (web-only) or Backend-only.',
      }),
      r('Full Stack Application Developer', 'practitioner', 'Delivers business applications end-to-end including auth, API and admin UI.', {
        priority: 120,
        eligibilityNote:
          'Full stack application developer — not Application Developer (general) or Web Application-only roles.',
      }),
      r('Mid-Level Full Stack Developer', 'practitioner', 'Owns complex epics spanning deployment, API design and responsive UI.', {
        priority: 130,
        eligibilityNote:
          'Mid-level full stack grade — not Mid-Level Software or Web developer titles.',
      }),
      r('Senior Full Stack Developer', 'senior', 'Senior IC leading vertical features and mentoring on both client and server code.', {
        priority: 150,
        eligibilityNote:
          'Senior full stack — both tiers; not Senior Frontend or Senior Backend-only developer titles.',
      }),
      r('Senior Full Stack Engineer', 'senior', 'Drives full-stack architecture within squads: caching, API contracts and UI state.', {
        priority: 160,
        eligibilityNote:
          'Senior full stack engineer — not Senior Software or Web Engineer without dual-tier scope.',
      }),
      r('Senior Full Stack Web Developer', 'senior', 'Senior web full stack expert for SaaS products with cloud-hosted APIs and SPAs.', {
        priority: 170,
        eligibilityNote:
          'Senior full stack web — not Senior Web Developer (web-only) or Senior Backend-only roles.',
      }),
      r('Senior Full Stack Application Developer', 'senior', 'Owns enterprise app modules from database migrations through to user workflows.', {
        priority: 180,
        eligibilityNote:
          'Senior full stack application — not Senior Application Developer (general software).',
      }),
      r('Staff Full Stack Engineer', 'senior', 'Org-wide full-stack patterns, monorepo strategy and shared service templates.', {
        priority: 190,
        eligibilityNote:
          'Staff full stack engineer — not Staff Software, Web or Frontend engineer titles.',
      }),
      r('Lead Full Stack Developer', 'lead_principal', 'Technical lead ensuring squad members can deliver across the entire stack.', {
        priority: 210,
        eligibilityNote:
          'Lead full stack — not Lead Web, Frontend or Backend developer titles.',
      }),
      r('Full Stack Development Team Lead', 'lead_principal', 'Leads full-stack squads with end-to-end delivery accountability.', {
        priority: 220,
        eligibilityNote:
          'Full stack team lead — distinct from Software or Web development team leads.',
      }),
      r('Principal Full Stack Engineer', 'lead_principal', 'Principal IC defining stack choices, shared libraries and vertical-slice practices.', {
        priority: 230,
        eligibilityNote:
          'Principal full stack engineer — not Principal Software or Web engineer titles.',
      }),
      r('Full Stack Solutions Architect', 'architect_specialist', 'Architects solutions spanning UI, services, data and deployment for UK products.', {
        priority: 240,
        roleCategory: 'design',
        eligibilityNote:
          'Full stack solutions architect — end-to-end; not Frontend-only or Backend Platform-only architects.',
      }),
      r('Full Stack Platform Architect', 'architect_specialist', 'Shared platform for full-stack teams: API gateways, BFF patterns and UI kits.', {
        priority: 250,
        roleCategory: 'design',
        eligibilityNote:
          'Full stack platform architect — not Web Platform or Backend Platform architect alone.',
      }),
      r('Enterprise Full Stack Architect', 'architect_specialist', 'Enterprise reference architectures for vertically integrated application delivery.', {
        priority: 260,
        roleCategory: 'design',
        eligibilityNote:
          'Enterprise full stack architect — both tiers; not Enterprise Software or Web architect alone.',
      }),
      r('Full Stack Development Manager', 'manager_head', 'Manages full-stack developers with end-to-end feature ownership expectations.', {
        priority: 270,
        roleCategory: 'leadership',
        eligibilityNote:
          'Full stack development manager — not Frontend-only or Backend-only managers.',
      }),
      r('Head of Full Stack Development', 'manager_head', 'Heads full-stack engineering groups in product-led UK organisations.', {
        priority: 280,
        roleCategory: 'leadership',
        eligibilityNote:
          'Head of full stack — distinct from Head of Software or Web Development.',
      }),
      r('Full Stack Engineering Manager', 'manager_head', 'Engineering manager for squads expected to ship across UI and API layers.', {
        priority: 290,
        roleCategory: 'leadership',
        eligibilityNote:
          'Full stack engineering manager — not Software Engineering Manager without stack breadth.',
      }),
      r('Director of Full Stack Engineering', 'director_executive', 'Director owning full-stack engineering strategy and cross-team platform alignment.', {
        priority: 300,
        roleCategory: 'leadership',
        eligibilityNote:
          'Director full stack — not Director of Software or Frontend Engineering alone.',
      }),
      r('VP of Full Stack Development', 'director_executive', 'Executive leadership for full-stack product engineering organisation.', {
        priority: 310,
        roleCategory: 'leadership',
        eligibilityNote:
          'VP full stack development — executive dual-tier scope; not VP Software or Web alone.',
      }),
    ],
  },
  {
    slug: 'frontend-development',
    label: 'Frontend Development',
    professionalBody: 'BCS, The Chartered Institute for IT',
    relatedBodies: ['React', 'Angular', 'Vue.js', 'MDN Web Docs'],
    sources: [...BASE_SOURCES, 'mdn_frontend_development', 'frontend_masters_careers'],
    siblingSlugs: [...FRONTEND_SIBLINGS],
    roles: [
      r('Frontend Development Apprentice', 'entry_trainee', 'Apprenticeship focused on UI implementation, accessibility and component-based front ends.', {
        priority: 10,
        eligibilityNote:
          'Frontend entry — UI/browser presentation layer; not Backend, Mobile native or general Software apprenticeships.',
      }),
      r('Trainee Frontend Developer', 'entry_trainee', 'Trainee implementing designs in HTML/CSS/JS frameworks under senior frontend guidance.', {
        priority: 20,
        eligibilityNote:
          'Trainee frontend — not Trainee Web-only (whole-site) or Backend developer titles.',
      }),
      r('Graduate Frontend Developer', 'entry_trainee', 'Graduate role on design systems and SPA features for UK digital products.', {
        priority: 30,
        eligibilityNote:
          'Graduate frontend — not Graduate Web, Full Stack or Backend graduate titles.',
      }),
      r('Entry-Level UI Developer', 'entry_trainee', 'Entry UI role translating Figma specs into accessible, responsive components.', {
        priority: 40,
        eligibilityNote:
          'Entry UI developer — presentation layer; not Entry-Level Server Developer or Backend entry roles.',
      }),
      r('Junior Frontend Developer', 'junior', 'Builds React/Vue/Angular components, state management and unit tests for UI.', {
        priority: 50,
        eligibilityNote:
          'Junior frontend — UI specialism; not Junior Web Developer (whole-site) or Backend roles.',
      }),
      r('Associate Frontend Engineer', 'junior', 'Associate on frontend squads integrating with APIs but not owning server logic.', {
        priority: 60,
        eligibilityNote:
          'Associate frontend engineer — distinct from Associate Software or Web Engineer titles.',
      }),
      r('Junior React Developer', 'junior', 'Junior React/Next.js developer for component libraries and client-side routing.', {
        priority: 70,
        eligibilityNote:
          'Junior React developer — frontend framework; not Junior Backend API or Mobile iOS roles.',
      }),
      r('Junior UI Developer', 'junior', 'Junior focus on pixel-perfect UI, design tokens and Storybook documentation.', {
        priority: 80,
        eligibilityNote:
          'Junior UI developer — not Junior HTML/CSS Developer (web markup) or Backend junior titles.',
      }),
      r('Frontend Developer', 'practitioner', 'Mid-level IC delivering complex UI flows, performance optimisation and a11y compliance.', {
        priority: 90,
        eligibilityNote:
          'Mid frontend developer — not Mid-Level Web, Backend or Full Stack developer titles.',
      }),
      r('Frontend Engineer', 'practitioner', 'Engineers robust front-end architecture: bundling, lazy loading and error boundaries.', {
        priority: 100,
        eligibilityNote:
          'Frontend engineer (mid) — not Web Engineer or Backend Engineer titles.',
      }),
      r('UI Developer', 'practitioner', 'Mid UI specialist for design-system-driven products and cross-browser compatibility.', {
        priority: 110,
        eligibilityNote:
          'UI developer (mid) — presentation focus; not Backend Server-Side or Mobile App roles.',
      }),
      r('React Frontend Developer', 'practitioner', 'Mid-level React specialist for hooks, context and testing with Testing Library.', {
        priority: 120,
        eligibilityNote:
          'React frontend developer — not React roles listed under Full Stack or Web-only titles.',
      }),
      r('Mid-Level Frontend Developer', 'practitioner', 'Owns frontend epics, Core Web Vitals and component API design for squads.', {
        priority: 130,
        eligibilityNote:
          'Mid-level frontend grade — not Mid-Level Software or Web developer titles.',
      }),
      r('Senior Frontend Developer', 'senior', 'Leads frontend quality, design-system governance and complex UI architecture.', {
        priority: 150,
        eligibilityNote:
          'Senior frontend — not Senior Web Developer (whole-site) or Senior Backend developer titles.',
      }),
      r('Senior Frontend Engineer', 'senior', 'Senior IC for frontend platform decisions, micro-frontends and build tooling.', {
        priority: 160,
        eligibilityNote:
          'Senior frontend engineer — not Senior Software or Web Engineer without UI specialism.',
      }),
      r('Senior UI Developer', 'senior', 'Owns UI standards, animation performance and accessibility audits for UK products.', {
        priority: 170,
        eligibilityNote:
          'Senior UI developer — not Senior Website Developer or Senior Backend API roles.',
      }),
      r('Senior React Developer', 'senior', 'Deep React expertise: server components, state machines and large-scale refactors.', {
        priority: 180,
        eligibilityNote:
          'Senior React developer — frontend specialism; not Senior Full Stack Web Developer titles.',
      }),
      r('Staff Frontend Engineer', 'senior', 'Org-wide frontend standards, design-system platform and performance budgets.', {
        priority: 190,
        eligibilityNote:
          'Staff frontend engineer — not Staff Software, Web or Backend engineer titles.',
      }),
      r('Lead Frontend Developer', 'lead_principal', 'Technical lead for frontend squads; PR standards and framework roadmap.', {
        priority: 210,
        eligibilityNote:
          'Lead frontend — not Lead Web, Full Stack or Backend developer titles.',
      }),
      r('Frontend Development Team Lead', 'lead_principal', 'Leads frontend developers across products; balances UX and delivery.', {
        priority: 220,
        eligibilityNote:
          'Frontend development team lead — distinct from Web or Software development team leads.',
      }),
      r('Principal Frontend Engineer', 'lead_principal', 'Principal IC for frontend technology strategy and cross-team UI consistency.', {
        priority: 230,
        eligibilityNote:
          'Principal frontend engineer — not Principal Software or Web engineer titles.',
      }),
      r('Frontend Solutions Architect', 'architect_specialist', 'Architects frontend solution patterns: SSR, CSR, edge rendering and CDN strategy.', {
        priority: 240,
        roleCategory: 'design',
        eligibilityNote:
          'Frontend solutions architect — UI layer; not Backend Solutions or Mobile Solutions architects.',
      }),
      r('Frontend Platform Architect', 'architect_specialist', 'Owns shared frontend platform, monorepo tooling and design-system infrastructure.', {
        priority: 250,
        roleCategory: 'design',
        eligibilityNote:
          'Frontend platform architect — not Web Platform (whole-site) or Backend Platform architects.',
      }),
      r('UI Architecture Lead', 'architect_specialist', 'Lead architect for UI architecture, information architecture and interaction patterns.', {
        priority: 260,
        roleCategory: 'design',
        eligibilityNote:
          'UI architecture lead — frontend/UI focus; not Enterprise Software or API architects.',
      }),
      r('Frontend Development Manager', 'manager_head', 'Manages frontend developers; hiring for UI skills and design collaboration.', {
        priority: 270,
        roleCategory: 'leadership',
        eligibilityNote:
          'Frontend development manager — not Web, Backend or Full Stack development managers.',
      }),
      r('Head of Frontend Development', 'manager_head', 'Heads frontend engineering across digital products and design partnerships.', {
        priority: 280,
        roleCategory: 'leadership',
        eligibilityNote:
          'Head of frontend — distinct from Head of Web or Software Development.',
      }),
      r('Frontend Engineering Manager', 'manager_head', 'Engineering manager for UI-focused squads with Core Web Vitals accountability.', {
        priority: 290,
        roleCategory: 'leadership',
        eligibilityNote:
          'Frontend engineering manager — not Software or Web Engineering Manager titles.',
      }),
      r('Director of Frontend Engineering', 'director_executive', 'Director owning frontend strategy, design-system investment and headcount.', {
        priority: 300,
        roleCategory: 'leadership',
        eligibilityNote:
          'Director frontend engineering — not Director of Web or Software Engineering.',
      }),
      r('VP of Frontend Development', 'director_executive', 'Executive leadership for frontend organisation and user experience engineering.', {
        priority: 310,
        roleCategory: 'leadership',
        eligibilityNote:
          'VP frontend development — executive UI scope; not VP Web or Software Development.',
      }),
    ],
  },
  {
    slug: 'backend-development',
    label: 'Backend Development',
    professionalBody: 'BCS, The Chartered Institute for IT',
    relatedBodies: ['AWS', 'Microsoft Azure', 'PostgreSQL', 'Docker'],
    sources: [...BASE_SOURCES, 'aws_developer_careers', 'microsoft_learn_backend'],
    siblingSlugs: [...BACKEND_SIBLINGS],
    roles: [
      r('Backend Development Apprentice', 'entry_trainee', 'Apprenticeship on server-side logic, databases and API fundamentals under supervision.', {
        priority: 10,
        eligibilityNote:
          'Backend entry — server/API/data layer; not Frontend, Mobile native or Web-only apprenticeships.',
      }),
      r('Trainee Backend Developer', 'entry_trainee', 'Trainee writing services, SQL queries and unit tests on supervised backend tasks.', {
        priority: 20,
        eligibilityNote:
          'Trainee backend — not Trainee Frontend or Trainee Web Developer titles.',
      }),
      r('Graduate Backend Developer', 'entry_trainee', 'Graduate role building REST/GraphQL services and database schemas in UK product teams.', {
        priority: 30,
        eligibilityNote:
          'Graduate backend — not Graduate Frontend, Web or Full Stack graduate titles.',
      }),
      r('Entry-Level Server Developer', 'entry_trainee', 'Entry server-side role maintaining APIs and background jobs; Linux/cloud basics expected.', {
        priority: 40,
        eligibilityNote:
          'Entry server developer — backend tier; not Entry-Level UI Developer or Web Programmer roles.',
      }),
      r('Junior Backend Developer', 'junior', 'Implements API endpoints, database migrations and integration tests.', {
        priority: 50,
        eligibilityNote:
          'Junior backend — not Junior Frontend, Web or Mobile developer titles.',
      }),
      r('Associate Backend Engineer', 'junior', 'Associate on service teams owning microservices and observability hooks.', {
        priority: 60,
        eligibilityNote:
          'Associate backend engineer — distinct from Associate Software or Frontend Engineer titles.',
      }),
      r('Junior API Developer', 'junior', 'Junior focus on REST/GraphQL API design, OpenAPI specs and contract testing.', {
        priority: 70,
        eligibilityNote:
          'Junior API developer — backend API specialism; not Junior Frontend or Web junior titles.',
      }),
      r('Junior Server-Side Developer', 'junior', 'Junior server-side logic in Java, C#, Python or Go under senior backend guidance.', {
        priority: 80,
        eligibilityNote:
          'Junior server-side — not Junior Full Stack or Frontend Web developer roles.',
      }),
      r('Backend Developer', 'practitioner', 'Mid-level IC delivering scalable services, caching and database optimisation.', {
        priority: 90,
        eligibilityNote:
          'Mid backend developer — not Mid-Level Frontend, Web or Full Stack developer titles.',
      }),
      r('Backend Engineer', 'practitioner', 'Engineers reliable backend systems with messaging, idempotency and fault tolerance.', {
        priority: 100,
        eligibilityNote:
          'Backend engineer (mid) — not Software Engineer or Web Engineer without server specialism.',
      }),
      r('API Developer', 'practitioner', 'Mid-level API specialist for public and internal APIs with versioning and rate limiting.', {
        priority: 110,
        eligibilityNote:
          'API developer (mid) — backend API focus; not Frontend or Mobile App developer roles.',
      }),
      r('Server-Side Developer', 'practitioner', 'Mid server-side developer for business logic, batch jobs and third-party integrations.', {
        priority: 120,
        eligibilityNote:
          'Server-side developer — not Server roles confused with Frontend UI or Web-only delivery.',
      }),
      r('Mid-Level Backend Developer', 'practitioner', 'Owns backend epics, query performance and deployment of services to UK cloud.', {
        priority: 130,
        eligibilityNote:
          'Mid-level backend grade — not Mid-Level Software or Frontend developer titles.',
      }),
      r('Senior Backend Developer', 'senior', 'Leads backend feature design, data modelling and production incident response.', {
        priority: 150,
        eligibilityNote:
          'Senior backend — not Senior Frontend, Web or Full Stack developer titles.',
      }),
      r('Senior Backend Engineer', 'senior', 'Senior IC for distributed systems, event-driven architecture and SLO definition.', {
        priority: 160,
        eligibilityNote:
          'Senior backend engineer — not Senior Software or Frontend Engineer without server scope.',
      }),
      r('Senior API Developer', 'senior', 'Owns API platform standards, developer portals and backward compatibility policy.', {
        priority: 170,
        eligibilityNote:
          'Senior API developer — backend APIs; not Senior Web Application or Frontend API consumer roles.',
      }),
      r('Senior Server-Side Developer', 'senior', 'Deep server-side expertise for high-throughput transactional systems in UK finance or retail.', {
        priority: 180,
        eligibilityNote:
          'Senior server-side — not Senior Full Stack or Senior Web developer titles.',
      }),
      r('Staff Backend Engineer', 'senior', 'Org-wide backend patterns, service templates and reliability engineering practices.', {
        priority: 190,
        eligibilityNote:
          'Staff backend engineer — not Staff Software, Web or Frontend engineer titles.',
      }),
      r('Lead Backend Developer', 'lead_principal', 'Technical lead for backend squads; schema review and production readiness gates.', {
        priority: 210,
        eligibilityNote:
          'Lead backend — not Lead Frontend, Web or Full Stack developer titles.',
      }),
      r('Backend Development Team Lead', 'lead_principal', 'Leads backend developers across services; capacity and on-call rotation planning.', {
        priority: 220,
        eligibilityNote:
          'Backend development team lead — distinct from Web or Frontend development team leads.',
      }),
      r('Principal Backend Engineer', 'lead_principal', 'Principal IC for backend technology roadmap, data stores and integration strategy.', {
        priority: 230,
        eligibilityNote:
          'Principal backend engineer — not Principal Software or Full Stack engineer titles.',
      }),
      r('Backend Solutions Architect', 'architect_specialist', 'Architects backend solutions: service boundaries, data flows and resilience patterns.', {
        priority: 240,
        roleCategory: 'design',
        eligibilityNote:
          'Backend solutions architect — server/data focus; not Frontend or Web Solutions architects.',
      }),
      r('Backend Platform Architect', 'architect_specialist', 'Owns shared backend platform: Kubernetes, service mesh and observability stack.', {
        priority: 250,
        roleCategory: 'design',
        eligibilityNote:
          'Backend platform architect — not Web Platform or Frontend Platform architect roles.',
      }),
      r('Enterprise API Architect', 'architect_specialist', 'Enterprise API strategy, governance and integration architecture for UK organisations.', {
        priority: 260,
        roleCategory: 'design',
        eligibilityNote:
          'Enterprise API architect — backend integration focus; not Enterprise Web or Software architects alone.',
      }),
      r('Backend Development Manager', 'manager_head', 'Manages backend developers; hiring for service design and operational excellence.', {
        priority: 270,
        roleCategory: 'leadership',
        eligibilityNote:
          'Backend development manager — not Frontend, Web or Full Stack development managers.',
      }),
      r('Head of Backend Development', 'manager_head', 'Heads backend engineering for microservices and data platform teams.', {
        priority: 280,
        roleCategory: 'leadership',
        eligibilityNote:
          'Head of backend — distinct from Head of Software or Frontend Development.',
      }),
      r('Backend Engineering Manager', 'manager_head', 'Engineering manager for service teams with uptime and latency accountability.', {
        priority: 290,
        roleCategory: 'leadership',
        eligibilityNote:
          'Backend engineering manager — not Software or Frontend Engineering Manager titles.',
      }),
      r('Director of Backend Engineering', 'director_executive', 'Director owning backend strategy, cloud spend and platform engineering alignment.', {
        priority: 300,
        roleCategory: 'leadership',
        eligibilityNote:
          'Director backend engineering — not Director of Software or Web Engineering.',
      }),
      r('VP of Backend Development', 'director_executive', 'Executive leadership for backend engineering organisation and data platform investment.', {
        priority: 310,
        roleCategory: 'leadership',
        eligibilityNote:
          'VP backend development — executive server/API scope; not VP Software or Frontend Development.',
      }),
    ],
  },
]
