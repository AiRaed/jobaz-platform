/**

 * New to the UK — profile classification and route resolution.

 */



import type {

  UkTransitionCategory,

  UkTransitionPathLetter,

  UkTransitionUnderstanding,

} from './ukTransitionTypes'



export function canClassifyUkTransition(u: UkTransitionUnderstanding): boolean {

  if (!u.profileType || !u.mainGoal || !u.interestArea) return false

  if (u.profileType === 'degree' && !u.qualificationField) return false

  if (u.profileType === 'work_experience' && !u.experienceArea) return false

  return true

}



export function resolveRouteId(u: UkTransitionUnderstanding): { routeId: string; routeLabel: string } {

  const { profileType, mainGoal, interestArea, qualificationField, experienceArea } = u



  if (profileType === 'starting_scratch') {

    if (mainGoal === 'quick_work') {

      if (interestArea === 'driving' || interestArea === 'hands_on') {

        return { routeId: 'entry_warehouse', routeLabel: 'Warehouse & Logistics' }

      }

      if (interestArea === 'people') {

        return { routeId: 'entry_hospitality', routeLabel: 'Hospitality Route' }

      }

    }

    if (interestArea === 'healthcare_education' || interestArea === 'people') {

      return { routeId: 'entry_care', routeLabel: 'Care Route' }

    }

    if (interestArea === 'hands_on') {

      return { routeId: 'entry_construction', routeLabel: 'Construction Entry Route' }

    }

    if (interestArea === 'driving') {

      return { routeId: 'entry_warehouse', routeLabel: 'Warehouse & Logistics' }

    }

    if (interestArea === 'office') {

      return { routeId: 'entry_office', routeLabel: 'Office & Administration' }

    }

    if (interestArea === 'business') {

      return { routeId: 'entry_hospitality', routeLabel: 'Hospitality Route' }

    }

    return { routeId: 'entry_security', routeLabel: 'Security & Facilities' }

  }



  if (profileType === 'work_experience') {

    const area = experienceArea ?? 'other'

    if (area === 'hospitality') return { routeId: 'exp_chef', routeLabel: 'Hospitality & Catering' }

    if (area === 'construction') return { routeId: 'exp_construction', routeLabel: 'Construction Worker' }

    if (area === 'driving') return { routeId: 'exp_driver', routeLabel: 'Driver' }

    if (area === 'trades') {

      if (interestArea === 'hands_on') return { routeId: 'exp_electrician', routeLabel: 'Electrician' }

      return { routeId: 'exp_plumber', routeLabel: 'Plumber / Trades' }

    }

    if (area === 'healthcare') return { routeId: 'degree_healthcare', routeLabel: 'Healthcare Support' }

    if (area === 'admin') return { routeId: 'entry_office', routeLabel: 'Administration' }

    return { routeId: 'exp_transferable', routeLabel: 'Transferable Experience Route' }

  }



  if (profileType === 'degree') {

    const field = qualificationField ?? 'other'

    if (field === 'healthcare') return { routeId: 'degree_healthcare', routeLabel: 'Healthcare' }

    if (field === 'education') return { routeId: 'degree_education', routeLabel: 'Education' }

    if (field === 'engineering') return { routeId: 'degree_engineering', routeLabel: 'Engineering' }

    if (field === 'accounting') return { routeId: 'degree_accounting', routeLabel: 'Accounting & Finance' }

    if (field === 'it') return { routeId: 'degree_it', routeLabel: 'IT & Technology' }

    if (field === 'business') return { routeId: 'degree_business', routeLabel: 'Business & Management' }

    return { routeId: 'degree_general', routeLabel: 'Professional Graduate Route' }

  }



  if (profileType === 'business') {

    if (mainGoal === 'start_business') {

      return { routeId: 'biz_startup', routeLabel: 'Start a Business' }

    }

    return { routeId: 'biz_background', routeLabel: 'Business Background' }

  }



  return { routeId: 'entry_no_course', routeLabel: 'Fast Entry Route' }

}



export function classifyUkTransitionProfile(u: UkTransitionUnderstanding): {

  category: UkTransitionCategory

  pathLetter: UkTransitionPathLetter

  label: string

  explanation: string

  routeId: string

  routeLabel: string

} {

  const route = resolveRouteId(u)



  if (u.profileType === 'degree') {

    return {

      category: 'qualified_professional',

      pathLetter: 'A',

      label: 'Degree Holder',

      explanation:

        'Your qualification still has value in the UK. Many people start with short certifications or support roles while building toward full recognition.',

      ...route,

    }

  }



  if (u.profileType === 'work_experience') {

    return {

      category: 'skilled_trade',

      pathLetter: 'B',

      label: 'International Experience',

      explanation:

        'You already have skills that can be transferred into the UK job market. The focus is on matching your experience — not starting from zero.',

      ...route,

    }

  }



  if (u.profileType === 'business') {

    return {

      category: 'business_background',

      pathLetter: 'C',

      label: 'Business Background',

      explanation:

        'Your commercial experience can transfer through employment, freelance work, consultancy, or a local service business.',

      ...route,

    }

  }



  return {

    category: 'limited_qualifications',

    pathLetter: 'D',

    label: 'Starting Fresh',

    explanation:

      'This route offers one of the fastest ways into employment. Many people start with short certifications and build successful careers.',

    ...route,

  }

}


