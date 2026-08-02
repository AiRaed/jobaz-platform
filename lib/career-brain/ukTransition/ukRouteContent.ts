/**
 * New to the UK — route content catalogue.
 */

import type { UkTransitionUnderstanding } from './ukTransitionTypes'

export type RouteContent = {
  summary: string
  whyRecommended: string
  courses: string[]
  jobs: Array<{ title: string; why: string }>
  noCourseJobs: string[]
  nextStep: string
  longTerm: string
}

export const NO_COURSE_FALLBACK = ['Cleaner', 'Kitchen Assistant', 'Warehouse Operative', 'Retail Assistant']

export const UK_ROUTES: Record<string, RouteContent> = {
  entry_security: {
    summary: 'Security work is a practical first step with short training and steady demand across the UK.',
    whyRecommended: 'You want to get working quickly and this route offers one of the fastest ways into employment.',
    courses: ['SIA Door Supervisor', 'CCTV Training'],
    jobs: [
      { title: 'Security Officer', why: 'Entry role after SIA training — widely available.' },
      { title: 'Event Security', why: 'Flexible shifts, good for building UK work history.' },
      { title: 'Concierge', why: 'Customer-facing role that uses people skills.' },
    ],
    noCourseJobs: ['Cleaner', 'Retail Assistant'],
    nextStep: 'Research SIA-approved training providers and compare course dates near you.',
    longTerm: 'Move into supervisory security, facilities management, or specialist roles.',
  },
  entry_warehouse: {
    summary: 'Warehouse and logistics roles hire quickly and suit hands-on or driving-related work.',
    whyRecommended: 'This route offers one of the fastest ways into employment while you build UK experience.',
    courses: ['Forklift Counterbalance', 'Reach Truck'],
    jobs: [
      { title: 'Warehouse Operative', why: 'High demand — often no degree required.' },
      { title: 'Picker Packer', why: 'Fast hiring cycle, good for a first UK job.' },
      { title: 'Logistics Assistant', why: 'Stepping stone toward team lead or driving roles.' },
    ],
    noCourseJobs: ['Warehouse Operative', 'Retail Assistant'],
    nextStep: 'Apply for warehouse roles now — add forklift training once you have a job offer or employer support.',
    longTerm: 'Progress to team leader, HGV driving, or logistics coordination.',
  },
  entry_construction: {
    summary: 'Construction sites need reliable labour — a CSCS card opens the door to steady site work.',
    whyRecommended: 'Hands-on work matches your interests and builds skills employers recognise quickly.',
    courses: ['CSCS Green Card', 'Health & Safety'],
    jobs: [
      { title: 'Construction Labourer', why: 'Common entry point on UK building sites.' },
      { title: 'Site Assistant', why: 'Learn site routines while earning.' },
    ],
    noCourseJobs: ['Labourer (general)', 'Warehouse Operative'],
    nextStep: 'Book a CSCS test and green card course — many employers expect this before your first shift.',
    longTerm: 'Train in a trade or move into site supervision.',
  },
  entry_care: {
    summary: 'Care and support work values compassion and reliability — short courses can help you start quickly.',
    whyRecommended: 'Working with people aligns with your interests and care roles are always in demand.',
    courses: ['Care Certificate', 'Moving & Handling', 'First Aid'],
    jobs: [
      { title: 'Care Assistant', why: 'Entry role in homes and community care.' },
      { title: 'Support Worker', why: 'Build experience while helping people day to day.' },
    ],
    noCourseJobs: ['Domestic Cleaner', 'Kitchen Assistant'],
    nextStep: 'Look for care assistant vacancies — many employers train you while you complete the Care Certificate.',
    longTerm: 'Senior care, nursing associate pathways, or specialist support roles.',
  },
  entry_hospitality: {
    summary: 'Hotels, restaurants, and catering hire regularly — food hygiene training is quick and recognised.',
    whyRecommended: 'Hospitality is one of the fastest sectors for new arrivals to find their first UK job.',
    courses: ['Food Hygiene', 'Customer Service Basics'],
    jobs: [
      { title: 'Kitchen Assistant', why: 'Fast entry — food service experience abroad helps.' },
      { title: 'Catering Assistant', why: 'Schools, hospitals, and events hire regularly.' },
      { title: 'Hotel Assistant', why: 'Front-of-house or housekeeping with training on the job.' },
    ],
    noCourseJobs: ['Kitchen Assistant', 'Retail Assistant'],
    nextStep: 'Complete an online Level 2 Food Hygiene certificate — it strengthens applications quickly.',
    longTerm: 'Chef, supervisor, or hotel operations roles as you gain UK references.',
  },
  entry_office: {
    summary: 'Office and admin roles suit organised people — many start without formal retraining.',
    whyRecommended: 'Your interest in office work opens admin routes that build transferable UK experience.',
    courses: ['Customer Service Basics', 'Microsoft Office / Digital Skills'],
    jobs: [
      { title: 'Admin Assistant', why: 'Uses organisation and communication skills.' },
      { title: 'Receptionist', why: 'Good first UK role with clear progression.' },
      { title: 'Data Entry Clerk', why: 'Steady work while you improve digital skills.' },
    ],
    noCourseJobs: ['Retail Assistant', 'Warehouse Operative'],
    nextStep: 'Tailor a simple UK CV highlighting admin and computer skills — then apply broadly.',
    longTerm: 'Office manager, finance admin, or specialist coordinator roles.',
  },
  entry_no_course: {
    summary: 'You can start earning quickly while planning longer-term training.',
    whyRecommended: 'Finding work quickly is your priority, so we included realistic jobs you can pursue right away.',
    courses: [],
    jobs: [
      { title: 'Cleaner', why: 'Flexible hours, often immediate start.' },
      { title: 'Kitchen Assistant', why: 'Common first job while building references.' },
      { title: 'Warehouse Operative', why: 'Steady demand across the UK.' },
      { title: 'Retail Assistant', why: 'Build customer service experience quickly.' },
    ],
    noCourseJobs: NO_COURSE_FALLBACK,
    nextStep: 'Apply to 3–5 entry roles this week — add a short course later if helpful.',
    longTerm: 'Use your first UK job as a platform for training and better-fit roles.',
  },
  exp_chef: {
    summary: 'Your kitchen experience abroad still has value in UK hospitality.',
    whyRecommended: 'Your previous experience still has value. We matched you to hospitality, not unrelated entry work.',
    courses: ['Food Hygiene', 'HACCP'],
    jobs: [
      { title: 'Chef', why: 'Use your international kitchen experience directly.' },
      { title: 'Kitchen Supervisor', why: 'Leadership from abroad transfers with UK hygiene certs.' },
      { title: 'Catering Roles', why: 'Schools, events, and contract catering hire regularly.' },
    ],
    noCourseJobs: ['Kitchen Assistant', 'Commis Chef'],
    nextStep: 'Add Food Hygiene Level 2 to your CV and apply to matching kitchens.',
    longTerm: 'Head chef, catering manager, or your own food business.',
  },
  exp_electrician: {
    summary: 'Electricians with overseas experience can progress through UK assessment and site certification.',
    whyRecommended: 'You already have skills that can be transferred — stay in the trade.',
    courses: ['ECS Card', 'Health & Safety', 'Site Certifications'],
    jobs: [
      { title: "Electrician's Mate", why: 'Supervised site work while UK quals are assessed.' },
      { title: 'Maintenance Electrician', why: 'Facilities roles sometimes accept strong experience.' },
    ],
    noCourseJobs: ['Electrical Labourer', 'Site Assistant'],
    nextStep: 'Contact a UK college about trade skills assessment for your experience.',
    longTerm: 'Fully qualified electrician with ECS card.',
  },
  exp_plumber: {
    summary: 'Plumbing experience can lead to UK trade routes through assessment and site safety training.',
    whyRecommended: 'Your trade skills matter — the path focuses on UK certification, not unrelated jobs.',
    courses: ['Trade Certification Routes', 'Site Safety'],
    jobs: [
      { title: "Plumber's Mate", why: 'Gain UK site references while certification is assessed.' },
      { title: 'Maintenance Plumber', why: 'Housing and facilities roles with strong demand.' },
    ],
    noCourseJobs: ['Construction Labourer', 'Site Assistant'],
    nextStep: 'Speak to a local college about NVQ recognition or a skills assessment.',
    longTerm: 'Gas Safe registration and self-employed plumbing when qualified.',
  },
  exp_driver: {
    summary: 'Driving experience opens taxi, delivery, and HGV routes — each needs UK licensing.',
    whyRecommended: 'Your driving background maps to licensed roles with clear earning potential.',
    courses: ['Taxi Licensing', 'HGV', 'CPC'],
    jobs: [
      { title: 'Delivery Driver', why: 'Often the quickest route using your driving experience.' },
      { title: 'Private Hire Driver', why: 'After local taxi/private hire licensing.' },
      { title: 'HGV Driver', why: 'Higher pay once HGV licence and CPC are complete.' },
    ],
    noCourseJobs: ['Van Driver', 'Courier'],
    nextStep: 'Check local taxi/private hire licensing rules — or explore funded HGV training.',
    longTerm: 'HGV class 1, fleet work, or transport business ownership.',
  },
  exp_construction: {
    summary: 'Construction experience transfers through CSCS and site safety certifications.',
    whyRecommended: 'Your site experience is relevant — UK employers value safety cards and reliable workers.',
    courses: ['CSCS', 'IPAF', 'PASMA'],
    jobs: [
      { title: 'Construction Worker', why: 'Use your experience on UK sites with valid CSCS.' },
      { title: 'Site Operative', why: 'Steady demand on housing and infrastructure projects.' },
    ],
    noCourseJobs: ['Construction Labourer', 'Site Assistant'],
    nextStep: 'Get your CSCS card sorted first — then apply to agencies placing experienced operatives.',
    longTerm: 'Skilled trade qualification, site supervision, or specialist plant operation.',
  },
  exp_transferable: {
    summary: 'Your international work history gives you transferable skills in the UK job market.',
    whyRecommended: 'We avoided pushing you into unrelated low-skilled work — your experience still counts.',
    courses: ['Customer Service Basics', 'Health & Safety'],
    jobs: [
      { title: 'Role matching your experience', why: 'Apply in the sector you already know.' },
      { title: 'Team Member / Operative', why: 'Entry to a familiar industry while references build.' },
    ],
    noCourseJobs: ['Retail Assistant', 'Warehouse Operative'],
    nextStep: 'Rewrite your CV in UK format highlighting measurable results from abroad.',
    longTerm: 'Return to senior or specialist work as UK references build.',
  },
  degree_healthcare: {
    summary: 'Healthcare qualifications can lead to support roles now and professional registration over time.',
    whyRecommended: 'Your qualification still has value — many start in support roles while completing UK registration.',
    courses: ['IELTS', 'OET', 'PLAB Preparation', 'OSCE Preparation'],
    jobs: [
      { title: 'Healthcare Assistant', why: 'Common bridge role on a registration pathway.' },
      { title: 'Support Roles', why: 'Build NHS or care sector UK experience.' },
      { title: 'Professional Registration Route', why: 'Long-term goal with the relevant UK body.' },
    ],
    noCourseJobs: ['Care Assistant', 'Support Worker'],
    nextStep: 'Check the relevant UK regulator and start English evidence if required.',
    longTerm: 'Fully registered healthcare professional in the UK.',
  },
  degree_education: {
    summary: 'Education backgrounds can progress through classroom support and QTS pathways.',
    whyRecommended: 'Your education background fits schools — support roles build UK classroom experience.',
    courses: ['Teaching Assistant', 'Safeguarding', 'QTS Pathway'],
    jobs: [
      { title: 'Teaching Assistant', why: 'Gain UK classroom experience while planning QTS.' },
      { title: 'Learning Support Assistant', why: 'Uses your education background directly.' },
    ],
    noCourseJobs: ['After-school Club Assistant'],
    nextStep: 'Apply for TA roles and research QTS routes for overseas-trained teachers.',
    longTerm: 'Qualified teacher or education specialist in the UK.',
  },
  degree_engineering: {
    summary: 'Engineering degrees transfer well — combine recognition with technician or graduate roles.',
    whyRecommended: 'Your engineering qualification opens technical roles while recognition progresses.',
    courses: ['AutoCAD', 'Revit', 'Health & Safety', 'Project Management'],
    jobs: [
      { title: 'Engineering Technician', why: 'Keeps you in engineering while recognition completes.' },
      { title: 'Graduate Engineer', why: 'Matches your degree level with UK employers.' },
    ],
    noCourseJobs: ['CAD Technician', 'Technical Assistant'],
    nextStep: 'Get an ENIC/NARIC statement and apply to firms hiring internationally trained staff.',
    longTerm: 'Chartered or incorporated engineer with UK project experience.',
  },
  degree_accounting: {
    summary: 'Finance backgrounds align with AAT, ACCA, and payroll routes in the UK.',
    whyRecommended: 'Your qualification maps to well-defined UK finance career ladders.',
    courses: ['AAT', 'ACCA', 'Bookkeeping', 'Payroll'],
    jobs: [
      { title: 'Accounts Assistant', why: 'Uses your skills while UK recognition progresses.' },
      { title: 'Bookkeeper', why: 'Strong demand for SMEs and in-house roles.' },
    ],
    noCourseJobs: ['Finance Administrator', 'Payroll Administrator'],
    nextStep: 'Explore AAT or ACCA exemptions based on your overseas qualification.',
    longTerm: 'Qualified accountant or finance manager in the UK.',
  },
  degree_it: {
    summary: 'IT skills are in high demand — certifications complement your degree for UK employers.',
    whyRecommended: 'Technology roles often value skills and portfolios as much as where you qualified.',
    courses: ['CompTIA', 'Cyber Security', 'Cloud Certifications', 'Data Analysis'],
    jobs: [
      { title: 'IT Support', why: 'Common entry with clear progression to specialist roles.' },
      { title: 'Junior Developer / Analyst', why: 'Portfolio and skills often matter most.' },
    ],
    noCourseJobs: ['Helpdesk Analyst'],
    nextStep: 'Refresh your portfolio and target roles that list your stack or cloud platform.',
    longTerm: 'Senior engineer, security specialist, or data lead.',
  },
  degree_business: {
    summary: 'Business degrees open admin, operations, and graduate scheme routes in the UK.',
    whyRecommended: 'Your business qualification supports office and management trainee roles.',
    courses: ['Project Management', 'Business Management', 'Digital Marketing Basics'],
    jobs: [
      { title: 'Business Administrator', why: 'Uses your degree while you build UK references.' },
      { title: 'Operations Coordinator', why: 'Good fit for management backgrounds.' },
    ],
    noCourseJobs: ['Admin Assistant', 'Retail Supervisor'],
    nextStep: 'Target graduate or trainee management roles highlighting international experience.',
    longTerm: 'Manager, consultant, or business owner.',
  },
  degree_general: {
    summary: 'Your degree is an asset — focus on roles in your field while recognition steps run in parallel.',
    whyRecommended: 'Many people start with short certifications and build successful careers from associate roles.',
    courses: ['Professional body conversion (field-specific)', 'Health & Safety'],
    jobs: [
      { title: 'Associate / Assistant in your field', why: 'Stay close to your qualification.' },
      { title: 'Graduate role', why: 'Trainee schemes for degree holders.' },
    ],
    noCourseJobs: ['Admin Assistant', 'Customer Service Advisor'],
    nextStep: 'Verify your qualification with ENIC/NARIC and identify the relevant UK body.',
    longTerm: 'Fully aligned professional career in the UK.',
  },
  biz_background: {
    summary: 'Business owners and managers can pivot into employment, freelance work, or a new UK venture.',
    whyRecommended: 'Your commercial experience can transfer through employment, self-employment, or consultancy.',
    courses: ['Self-Employment Essentials', 'Business Management', 'Bookkeeping Basics', 'Digital Marketing Basics'],
    jobs: [
      { title: 'Supervisor / Manager', why: 'Uses leadership from running or managing a business.' },
      { title: 'Freelance / Consultancy', why: 'Sell your expertise to UK clients in your sector.' },
      { title: 'Local Service Business', why: 'Start small and validate demand.' },
    ],
    noCourseJobs: ['Team Leader', 'Operations Assistant'],
    nextStep: 'Decide: industry job, freelance offer, or a small validated business idea.',
    longTerm: 'Sustainable self-employment or senior employment using your track record.',
  },
  biz_startup: {
    summary: 'Starting a UK business is realistic with a small validated idea and basic compliance.',
    whyRecommended: 'You chose to start a business — this path focuses on practical setup, not generic job search.',
    courses: ['Self-Employment Essentials', 'Bookkeeping Basics', 'Digital Marketing Basics'],
    jobs: [
      { title: 'Freelance Work', why: 'Fastest path to income while you build a client base.' },
      { title: 'Consultancy', why: 'Package your industry knowledge for UK buyers.' },
      { title: 'Local Service Business', why: 'Start with one service and one customer segment.' },
    ],
    noCourseJobs: ['Part-time work (while building)'],
    nextStep: 'Validate one business idea with 5 conversations with potential customers this week.',
    longTerm: 'Registered UK business with repeat customers and clear compliance.',
  },
}

export function getRouteContent(u: UkTransitionUnderstanding): RouteContent {
  const id = u.routeId ?? 'entry_no_course'
  return UK_ROUTES[id] ?? UK_ROUTES.entry_no_course!
}

