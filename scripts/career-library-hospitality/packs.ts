/**
 * Specialism definitions for Hospitality, Tourism & Events.
 * Deduped overlapping labels; Work in My Education–centred profiles.
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { buildPack, type SpecDef } from './roleFactory'
import type { SpecialismPack } from './shared'

const SRC = {
  ncs: 'national_careers_service_uk',
  prospects: 'prospects_uk_hospitality_tourism_events',
  ioh: 'institute_of_hospitality',
  ukh: 'uk_hospitality',
  tourism_soc: 'tourism_society_uk',
  visitbritain: 'visitbritain_visitengland',
  abpco: 'abpco_conference_organisers',
  mia: 'meetings_industry_association',
  eif: 'event_industry_forum',
  govuk: 'gov_uk_apprenticeships_hospitality',
}

function d(
  label: string,
  short: string,
  professionalBody: string,
  relatedBodies: string[],
  sources: string[],
  profile: SpecDef['profile'],
  domainTag: string,
  extra: Partial<SpecDef> = {}
): SpecDef {
  return {
    slug: normalizeSlug(undefined, label)!,
    label,
    short,
    professionalBody,
    relatedBodies,
    sources,
    profile,
    domainTag,
    ...extra,
  }
}

export const HTE_SPEC_DEFS: SpecDef[] = [
  // Hospitality Management
  d('Hospitality Management', 'Hospitality Management', 'Institute of Hospitality', ['IoH', 'UKHospitality'], [SRC.ioh, SRC.ukh, SRC.prospects, SRC.ncs], 'hospitality_mgmt', 'hospitality_mgmt', { includeOwnership: true }),
  d('International Hospitality Management', 'International Hospitality Mgmt', 'Institute of Hospitality', ['IoH'], [SRC.ioh, SRC.prospects], 'hospitality_mgmt', 'hospitality_mgmt', { mastersUseful: true, includeOwnership: true }),
  d('Hotel Management', 'Hotel Management', 'Institute of Hospitality', ['IoH', 'UKHospitality'], [SRC.ioh, SRC.ukh, SRC.ncs, SRC.prospects], 'hospitality_mgmt', 'hospitality_mgmt', { includeOwnership: true }),
  d('Resort Management', 'Resort Management', 'Institute of Hospitality', ['IoH'], [SRC.ioh, SRC.prospects], 'hospitality_mgmt', 'hospitality_mgmt'),
  d('Accommodation Management', 'Accommodation Management', 'Institute of Hospitality', ['IoH', 'UKHospitality'], [SRC.ioh, SRC.ukh, SRC.ncs], 'hospitality_mgmt', 'hospitality_mgmt'),
  d('Front Office Management', 'Front Office Management', 'Institute of Hospitality', ['IoH'], [SRC.ioh, SRC.ncs], 'hospitality_mgmt', 'hospitality_mgmt'),
  d('Guest Services Management', 'Guest Services Management', 'Institute of Hospitality', ['IoH'], [SRC.ioh, SRC.ukh], 'hospitality_mgmt', 'hospitality_mgmt'),
  d('Housekeeping Management', 'Housekeeping Management', 'Institute of Hospitality', ['IoH', 'UKHospitality'], [SRC.ioh, SRC.ukh], 'hospitality_mgmt', 'hospitality_mgmt'),
  d('Hospitality Operations', 'Hospitality Operations', 'Institute of Hospitality', ['IoH', 'UKHospitality'], [SRC.ioh, SRC.ukh, SRC.ncs], 'hospitality_mgmt', 'hospitality_mgmt'),
  d('Hospitality Business Development', 'Hospitality Business Development', 'Institute of Hospitality / UKHospitality', ['IoH', 'UKHospitality'], [SRC.ioh, SRC.ukh, SRC.prospects], 'commercial_analytical', 'commercial_analytical'),

  // Food and Beverage (Hospitality Revenue Management kept under commercial only)
  d('Food and Beverage Management', 'Food and Beverage Management', 'Institute of Hospitality', ['IoH', 'UKHospitality'], [SRC.ioh, SRC.ukh, SRC.ncs], 'food_beverage', 'food_beverage', {
    licenceHints: [
      { name: 'Food hygiene / food safety', level: 'employer_commonly_expects' },
      { name: 'Personal Licence awareness', level: 'useful' },
    ],
  }),
  d('Restaurant Management', 'Restaurant Management', 'Institute of Hospitality / UKHospitality', ['IoH', 'UKHospitality'], [SRC.ioh, SRC.ukh, SRC.ncs], 'food_beverage', 'food_beverage'),
  d('Catering Management', 'Catering Management', 'Institute of Hospitality', ['IoH'], [SRC.ioh, SRC.ncs], 'food_beverage', 'food_beverage'),
  d('Contract Catering', 'Contract Catering', 'UKHospitality / contract catering operators context', ['UKHospitality'], [SRC.ukh, SRC.ncs], 'food_beverage', 'food_beverage'),
  d('Licensed Hospitality Management', 'Licensed Hospitality Management', 'UKHospitality / BBPA context', ['UKHospitality', 'BBPA'], [SRC.ukh, SRC.ncs, SRC.govuk], 'food_beverage', 'food_beverage', {
    licenceHints: [
      { name: 'Personal Licence', level: 'useful', note: 'Often expected for DPS roles' },
      { name: 'Alcohol licensing context', level: 'employer_commonly_expects' },
    ],
  }),
  d('Bar and Beverage Management', 'Bar and Beverage Management', 'UKHospitality', ['UKHospitality'], [SRC.ukh, SRC.ncs], 'food_beverage', 'food_beverage'),
  d('Food Service Operations', 'Food Service Operations', 'Institute of Hospitality', ['IoH'], [SRC.ioh, SRC.ncs], 'food_beverage', 'food_beverage'),
  d('Culinary Business Management', 'Culinary Business Management', 'Institute of Hospitality / culinary schools context', ['IoH'], [SRC.ioh, SRC.prospects], 'culinary', 'culinary'),

  // Culinary
  d('Culinary Arts', 'Culinary Arts', 'Craft Guild of Chefs / IoH context', ['Craft Guild of Chefs', 'IoH'], [SRC.prospects, SRC.ncs, SRC.ioh], 'culinary', 'culinary'),
  d('Professional Cookery', 'Professional Cookery', 'Craft Guild of Chefs', ['Craft Guild of Chefs'], [SRC.ncs, SRC.govuk, SRC.prospects], 'culinary', 'culinary'),
  d('Culinary Management', 'Culinary Management', 'Institute of Hospitality', ['IoH'], [SRC.ioh, SRC.prospects], 'culinary', 'culinary'),
  d('Patisserie and Baking Management', 'Patisserie Baking Management', 'Craft Guild of Chefs context', ['Craft Guild of Chefs'], [SRC.ncs, SRC.prospects], 'culinary', 'culinary'),
  d('Menu Development', 'Menu Development', 'Institute of Hospitality', ['IoH'], [SRC.ioh, SRC.ukh], 'culinary', 'culinary'),
  d('Food Product Development for Hospitality', 'Hospitality Food Product Dev', 'IFST / IoH hospitality context', ['IFST', 'IoH'], [SRC.ioh, SRC.prospects], 'culinary', 'culinary', { mastersUseful: true }),
  d('Kitchen and Brigade Management', 'Kitchen Brigade Management', 'Craft Guild of Chefs / IoH', ['Craft Guild of Chefs', 'IoH'], [SRC.ioh, SRC.ncs], 'culinary', 'culinary'),

  // Tourism (Sustainable Tourism once; Tourism Research under academic)
  d('Tourism Management', 'Tourism Management', 'Tourism Society', ['Tourism Society', 'VisitBritain'], [SRC.tourism_soc, SRC.visitbritain, SRC.prospects, SRC.ncs], 'tourism', 'tourism', { mastersUseful: true }),
  d('International Tourism', 'International Tourism', 'Tourism Society', ['Tourism Society'], [SRC.tourism_soc, SRC.prospects], 'tourism', 'tourism', { mastersUseful: true }),
  d('Sustainable Tourism', 'Sustainable Tourism Practice', 'Tourism Society / VisitBritain', ['Tourism Society', 'VisitBritain'], [SRC.tourism_soc, SRC.visitbritain, SRC.prospects], 'sustainability_policy', 'sustainability_policy', { mastersUseful: true }),
  d('Responsible Tourism', 'Responsible Tourism', 'Tourism Society', ['Tourism Society'], [SRC.tourism_soc, SRC.prospects], 'sustainability_policy', 'sustainability_policy', { mastersUseful: true }),
  d('Destination Management', 'Destination Management', 'Tourism Society / VisitEngland DMOs', ['Tourism Society', 'VisitEngland'], [SRC.tourism_soc, SRC.visitbritain, SRC.prospects], 'tourism', 'tourism', { mastersUseful: true }),
  d('Visitor Economy', 'Visitor Economy', 'VisitBritain / Tourism Society', ['VisitBritain', 'Tourism Society'], [SRC.visitbritain, SRC.tourism_soc, SRC.prospects], 'tourism', 'tourism', { mastersUseful: true }),
  d('Cultural Tourism', 'Cultural Tourism', 'Tourism Society', ['Tourism Society'], [SRC.tourism_soc, SRC.prospects], 'tourism', 'tourism'),
  d('Heritage Tourism', 'Heritage Tourism', 'Tourism Society / heritage visitor context', ['Tourism Society'], [SRC.tourism_soc, SRC.prospects, SRC.ncs], 'tourism', 'tourism'),
  d('Eco-tourism', 'Eco-tourism', 'Tourism Society', ['Tourism Society'], [SRC.tourism_soc, SRC.prospects], 'sustainability_policy', 'sustainability_policy', { mastersUseful: true }),
  d('Tourism Development', 'Tourism Development', 'Tourism Society / VisitBritain', ['Tourism Society', 'VisitBritain'], [SRC.tourism_soc, SRC.visitbritain, SRC.prospects], 'tourism', 'tourism', { mastersUseful: true }),
  d('Tourism Policy', 'Tourism Policy (Sector)', 'Tourism Society / VisitBritain', ['Tourism Society'], [SRC.tourism_soc, SRC.visitbritain, SRC.prospects], 'sustainability_policy', 'sustainability_policy', { mastersUseful: true }),

  // Travel
  d('Travel Management', 'Travel Management', 'ABTA / Institute of Travel & Tourism context', ['ABTA', 'ITT'], [SRC.prospects, SRC.ncs], 'travel', 'travel'),
  d('Tour Operations', 'Tour Operations', 'ABTA / Tourism Society', ['ABTA', 'Tourism Society'], [SRC.prospects, SRC.ncs, SRC.tourism_soc], 'travel', 'travel'),
  d('Travel Agency Management', 'Travel Agency Management', 'ABTA', ['ABTA'], [SRC.ncs, SRC.prospects], 'travel', 'travel'),
  d('Business Travel', 'Business Travel', 'Institute of Travel Management context', ['ITM'], [SRC.prospects, SRC.ncs], 'travel', 'travel'),
  d('Corporate Travel', 'Corporate Travel Management', 'Institute of Travel Management context', ['ITM'], [SRC.prospects], 'travel', 'travel'),
  d('Cruise Tourism', 'Cruise Tourism', 'CLIA / Tourism Society context', ['CLIA', 'Tourism Society'], [SRC.prospects, SRC.tourism_soc], 'travel', 'travel'),
  d('Tour Guiding Management', 'Tour Guiding Management', 'Institute of Tourist Guiding / Tourism Society', ['ITG', 'Tourism Society'], [SRC.ncs, SRC.tourism_soc], 'travel', 'travel'),
  d('Travel Product Development', 'Travel Product Development', 'ABTA / Tourism Society', ['ABTA', 'Tourism Society'], [SRC.prospects, SRC.tourism_soc], 'travel', 'travel'),
  d('Travel Customer Experience', 'Travel Customer Experience', 'ABTA / CX hospitality context', ['ABTA'], [SRC.prospects, SRC.ncs], 'travel', 'travel'),

  // Events
  d('Events Management', 'Events Management', 'Event Industry Forum / ABPCO context', ['EIF', 'ABPCO'], [SRC.eif, SRC.abpco, SRC.prospects, SRC.ncs], 'events', 'events'),
  d('Conference Management', 'Conference Management', 'Association of British Professional Conference Organisers', ['ABPCO', 'MIA'], [SRC.abpco, SRC.mia, SRC.prospects], 'events', 'events'),
  d('Exhibition Management', 'Exhibition Management', 'Event Industry Forum / AEO context', ['EIF', 'AEO'], [SRC.eif, SRC.prospects], 'events', 'events'),
  d('Festival Management', 'Festival Management', 'Event Industry Forum', ['EIF'], [SRC.eif, SRC.prospects, SRC.ncs], 'events', 'events'),
  d('Corporate Events', 'Corporate Events', 'Meetings Industry Association', ['MIA', 'ABPCO'], [SRC.mia, SRC.abpco, SRC.prospects], 'events', 'events'),
  d('Wedding and Social Events', 'Wedding Social Events', 'Event Industry Forum / wedding planners context', ['EIF'], [SRC.eif, SRC.ncs, SRC.prospects], 'events', 'events'),
  d('Sports Events', 'Sports Events', 'Event Industry Forum / sports event organisers', ['EIF'], [SRC.eif, SRC.prospects], 'events', 'events'),
  d('Cultural Events', 'Cultural Events', 'Event Industry Forum', ['EIF'], [SRC.eif, SRC.prospects], 'events', 'events'),
  d('Live Events', 'Live Events', 'Event Industry Forum', ['EIF'], [SRC.eif, SRC.prospects, SRC.ncs], 'events', 'events'),
  d('Event Production', 'Event Production', 'Event Industry Forum', ['EIF'], [SRC.eif, SRC.prospects], 'events', 'events'),
  d('Event Operations', 'Event Operations', 'Event Industry Forum / MIA', ['EIF', 'MIA'], [SRC.eif, SRC.mia, SRC.ncs], 'events', 'events'),
  d('Event Marketing', 'Event Marketing (Sector)', 'Event Industry Forum / CIM events context', ['EIF'], [SRC.eif, SRC.prospects], 'events', 'events'),
  d('Event Safety and Compliance', 'Event Safety Compliance', 'Event Industry Forum / Purple Guide context', ['EIF'], [SRC.eif, SRC.govuk, SRC.ncs], 'events', 'events', {
    licenceHints: [
      { name: 'Event safety planning', level: 'strongly_recommended' },
      { name: 'Health and safety', level: 'employer_commonly_expects' },
    ],
  }),

  // Venues and Attractions
  d('Venue Management', 'Venue Management', 'Institute of Hospitality / MIA', ['IoH', 'MIA'], [SRC.ioh, SRC.mia, SRC.ncs], 'venues', 'venues'),
  d('Visitor Attraction Management', 'Visitor Attraction Management', 'ALVA / VisitEngland attractions', ['ALVA', 'VisitEngland'], [SRC.visitbritain, SRC.prospects, SRC.ncs], 'venues', 'venues'),
  d('Museum and Heritage Visitor Operations', 'Museum Heritage Visitor Ops', 'Museums Association / VisitEngland', ['MA', 'VisitEngland'], [SRC.visitbritain, SRC.ncs, SRC.prospects], 'venues', 'venues'),
  d('Theme Park Management', 'Theme Park Management', 'ALVA / UK attractions context', ['ALVA'], [SRC.visitbritain, SRC.ncs], 'venues', 'venues'),
  d('Leisure Attraction Management', 'Leisure Attraction Management', 'UKHospitality / ALVA context', ['UKHospitality', 'ALVA'], [SRC.ukh, SRC.visitbritain], 'venues', 'venues'),
  d('Conference Centre Management', 'Conference Centre Management', 'MIA / ABPCO venue context', ['MIA', 'ABPCO'], [SRC.mia, SRC.abpco, SRC.ioh], 'venues', 'venues'),
  d('Stadium and Arena Operations', 'Stadium Arena Operations', 'Event Industry Forum / venue operators', ['EIF'], [SRC.eif, SRC.ncs], 'venues', 'venues'),

  // Leisure and Recreation
  d('Leisure Management', 'Leisure Management', 'CIMSPA / leisure operators context', ['CIMSPA'], [SRC.prospects, SRC.ncs], 'leisure', 'leisure'),
  d('Recreation Management', 'Recreation Management', 'CIMSPA', ['CIMSPA'], [SRC.prospects, SRC.ncs], 'leisure', 'leisure'),
  d('Sports and Leisure Operations', 'Sports Leisure Operations', 'CIMSPA', ['CIMSPA'], [SRC.ncs, SRC.prospects], 'leisure', 'leisure'),
  d('Spa and Wellness Management', 'Spa Wellness Management', 'Institute of Hospitality / spa operators', ['IoH'], [SRC.ioh, SRC.prospects], 'leisure', 'leisure'),
  d('Holiday Park Management', 'Holiday Park Management', 'UKHospitality / BH&HPA context', ['UKHospitality', 'BH&HPA'], [SRC.ukh, SRC.ncs], 'leisure', 'leisure'),

  // Commercial and Analytical
  d('Hospitality Revenue Management', 'Hospitality Revenue Management', 'Institute of Hospitality / HSMAI context', ['IoH', 'HSMAI'], [SRC.ioh, SRC.prospects], 'commercial_analytical', 'commercial_analytical', { mastersUseful: true }),
  d('Hotel Revenue Management', 'Hotel Revenue Management', 'Institute of Hospitality / HSMAI', ['IoH', 'HSMAI'], [SRC.ioh, SRC.ukh, SRC.prospects], 'commercial_analytical', 'commercial_analytical', { mastersUseful: true }),
  d('Tourism Analytics', 'Tourism Analytics', 'VisitBritain / Tourism Society insight', ['VisitBritain', 'Tourism Society'], [SRC.visitbritain, SRC.tourism_soc, SRC.prospects], 'commercial_analytical', 'commercial_analytical', { mastersUseful: true }),
  d('Hospitality Finance and Commercial Management', 'Hospitality Finance Commercial', 'Institute of Hospitality / CIMA hospitality context', ['IoH'], [SRC.ioh, SRC.prospects], 'commercial_analytical', 'commercial_analytical', { mastersUseful: true }),
  d('Hospitality Sales', 'Hospitality Sales', 'Institute of Hospitality / HSMAI', ['IoH', 'HSMAI'], [SRC.ioh, SRC.ukh], 'commercial_analytical', 'commercial_analytical'),
  d('Hospitality Marketing', 'Hospitality Marketing (Sector)', 'Institute of Hospitality / CIM hospitality', ['IoH', 'CIM'], [SRC.ioh, SRC.prospects], 'commercial_analytical', 'commercial_analytical'),
  d('Distribution and Booking Systems', 'Distribution Booking Systems', 'Institute of Hospitality / OTAs context', ['IoH'], [SRC.ioh, SRC.ukh], 'commercial_analytical', 'commercial_analytical'),
  d('Hospitality Technology', 'Hospitality Technology', 'Institute of Hospitality / HITEC context', ['IoH'], [SRC.ioh, SRC.prospects], 'commercial_analytical', 'commercial_analytical'),
  d('Customer Experience Management', 'Customer Experience Management (Hosp)', 'Institute of Hospitality', ['IoH'], [SRC.ioh, SRC.ukh, SRC.prospects], 'commercial_analytical', 'commercial_analytical'),

  // Sustainability and Policy
  d('Sustainable Hospitality', 'Sustainable Hospitality', 'Institute of Hospitality / UKHospitality ESG', ['IoH', 'UKHospitality'], [SRC.ioh, SRC.ukh, SRC.prospects], 'sustainability_policy', 'sustainability_policy', { mastersUseful: true }),
  d('Destination Sustainability', 'Destination Sustainability', 'Tourism Society / VisitBritain', ['Tourism Society', 'VisitBritain'], [SRC.tourism_soc, SRC.visitbritain], 'sustainability_policy', 'sustainability_policy', { mastersUseful: true }),
  d('Hospitality ESG', 'Hospitality ESG', 'UKHospitality / IoH', ['UKHospitality', 'IoH'], [SRC.ukh, SRC.ioh], 'sustainability_policy', 'sustainability_policy', { mastersUseful: true }),
  d('Tourism Policy and Planning', 'Tourism Policy Planning', 'Tourism Society / VisitBritain', ['Tourism Society'], [SRC.tourism_soc, SRC.visitbritain, SRC.prospects], 'sustainability_policy', 'sustainability_policy', { mastersUseful: true }),
  d('Visitor Economy Development', 'Visitor Economy Development', 'VisitBritain / Tourism Society', ['VisitBritain', 'Tourism Society'], [SRC.visitbritain, SRC.tourism_soc], 'tourism', 'tourism', { mastersUseful: true }),

  // Academic and Research
  d('Hospitality Research', 'Hospitality Research', 'Institute of Hospitality / CHME academic networks', ['IoH', 'CHME'], [SRC.ioh, SRC.prospects], 'academic_focus', 'academic_research', { mastersUseful: true }),
  d('Tourism Research', 'Tourism Research', 'Tourism Society / academic tourism networks', ['Tourism Society'], [SRC.tourism_soc, SRC.prospects], 'academic_focus', 'academic_research', { mastersUseful: true }),
  d('Events Research', 'Events Research', 'Event Industry Forum / academic events networks', ['EIF'], [SRC.eif, SRC.prospects], 'academic_focus', 'academic_research', { mastersUseful: true }),
  d('Leisure Studies', 'Leisure Studies', 'Leisure Studies Association context', ['LSA'], [SRC.prospects], 'academic_focus', 'academic_research', { mastersUseful: true }),
  d('Visitor Economy Research', 'Visitor Economy Research', 'VisitBritain / academic visitor-economy research', ['VisitBritain'], [SRC.visitbritain, SRC.prospects], 'academic_focus', 'academic_research', { mastersUseful: true }),
]

const ALL_SLUGS = HTE_SPEC_DEFS.map((x) => x.slug)

export const HTE_PACKS: SpecialismPack[] = HTE_SPEC_DEFS.map((def) => buildPack(def, ALL_SLUGS))
