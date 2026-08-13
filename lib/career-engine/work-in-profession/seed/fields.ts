import { field } from './builders'
import type { ProfessionField } from '../types'

export const PROFESSION_FIELDS: ProfessionField[] = [
  field('security-facilities', 'Security & Facilities', 'Door, CCTV, events, and facilities security routes.', 10),
  field('care-support', 'Care & Support', 'Adult care, home care, and support worker pathways.', 20),
  field('construction-trades', 'Construction & Skilled Trades', 'Labouring and skilled building trades.', 30),
  field('electrical-technical', 'Electrical & Technical Trades', 'Electrical, PAT, fire alarm, and maintenance tech routes.', 40),
  field('plumbing-heating', 'Plumbing / Heating', 'Plumbing, heating, bathroom fitting, and pipefitting.', 50),
  field('warehouse-logistics', 'Warehouse & Logistics', 'Warehouse, FLT, stock, and goods-in/out roles.', 60),
  field('driving-transport', 'Driving & Transport', 'Delivery, taxi/PHV, van, HGV, and bus driving.', 70),
  field('hospitality', 'Hospitality', 'Front of house, kitchen, bar, and hotel pathways.', 80),
  field('cleaning-facilities', 'Cleaning & Facilities', 'Commercial cleaning and facilities support.', 90),
  field('retail-sales', 'Retail & Sales', 'Shop floor, stockroom, and retail customer service.', 100),
  field('office-admin', 'Office & Administration', 'Admin, reception, PA, and office coordination.', 110),
  field('customer-service', 'Customer Service & Call Centre', 'Call handling, live chat, and complaints.', 120),
  field('manufacturing-engineering', 'Manufacturing & Engineering Support', 'Production, assembly, QC, and maintenance support.', 130),
  field('digital-it-support', 'Digital & IT Support', 'IT helpdesk, web support, and junior digital roles.', 140),
  field('creative-design', 'Creative & Design Practical', 'Design, video, content, and creative assistant work.', 150),
  field('beauty-personal', 'Beauty & Personal Services', 'Barber, hair, beauty, nails, and makeup.', 160),
  field('childcare-education-support', 'Childcare & Education Support', 'TA, nursery, SEN, and childcare support.', 170),
  field('self-employment-local', 'Self Employment / Local Services', 'Handyman, mobile services, and small local business.', 180),
]
