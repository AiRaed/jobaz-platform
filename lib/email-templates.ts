/**
 * Email generation templates and logic
 * Provides professional email templates for top 20 purposes
 */

export type RecipientType = 'Manager' | 'HR' | 'Client' | 'University' | 'Landlord' | 'Other'
export type Tone = 'Formal' | 'Professional' | 'Friendly' | 'Firm'

export type EmailPurpose = 
  | 'job_application'
  | 'follow_up_interview'
  | 'thank_you_interview'
  | 'resignation'
  | 'sick_leave'
  | 'vacation_request'
  | 'meeting_request'
  | 'project_update'
  | 'complaint'
  | 'inquiry'
  | 'apology'
  | 'introduction'
  | 'payment_request'
  | 'deadline_extension'
  | 'collaboration'
  | 'feedback_request'
  | 'rejection'
  | 'acceptance'
  | 'rent_inquiry'
  | 'university_application'

export interface GenerateEmailParams {
  recipientType: RecipientType
  tone: Tone
  purpose: EmailPurpose
  senderName: string
  senderRole?: string
  senderPhone?: string
  // Additional fields based on purpose
  [key: string]: any
}

export interface GeneratedEmail {
  subject: string
  greeting: string
  body: string
  closing: string
  signature: string
}

/**
 * Generates a professional email based on parameters
 */
export function generateEmail(params: GenerateEmailParams): GeneratedEmail {
  const {
    recipientType,
    tone,
    purpose,
    senderName,
    senderRole = '',
    senderPhone = '',
  } = params

  // Get template for purpose
  const template = getTemplateForPurpose(purpose, tone, recipientType)
  
  // Fill in template with data
  const greeting = getGreeting(recipientType, tone, params.recipient_name || '')
  const body = fillTemplate(template.body, params)
  const closing = getClosing(tone)
  const signature = getSignature(senderName, senderRole, senderPhone)
  const subject = fillTemplate(template.subject, params)

  return {
    subject: subject.trim(),
    greeting: greeting.trim(),
    body: body.trim(),
    closing: closing.trim(),
    signature: signature.trim(),
  }
}

/**
 * Get email template for specific purpose
 */
function getTemplateForPurpose(
  purpose: EmailPurpose,
  tone: Tone,
  recipientType: RecipientType
): { subject: string; body: string } {
  const templates: Record<EmailPurpose, { subject: string; body: string }> = {
    job_application: {
      subject: 'Application for {{position_name}} Position',
      body: `I am writing to express my interest in the {{position_name}} position at {{company_name}}. 

With {{years_experience}} years of experience in {{field}}, I am confident that my skills and qualifications align well with your requirements.

I am particularly drawn to this opportunity because {{reason}}. I am excited about the possibility of contributing to {{company_name}}'s continued success.

I have attached my resume and cover letter for your review. I would welcome the opportunity to discuss how my background and experience can benefit your team.`,
    },
    follow_up_interview: {
      subject: 'Following Up on {{position_name}} Position',
      body: `I wanted to follow up regarding my application for the {{position_name}} position.

I remain very interested in this opportunity and am eager to learn about the next steps in the hiring process.

Please let me know if you need any additional information or documentation from my side.`,
    },
    thank_you_interview: {
      subject: 'Thank You - Interview for {{position_name}}',
      body: `Thank you for taking the time to meet with me today regarding the {{position_name}} position.

I enjoyed learning more about {{company_name}} and the role. Our discussion about {{topic_discussed}} was particularly insightful.

I am very interested in this opportunity and believe my experience in {{relevant_experience}} would be a great fit for your team.

I look forward to hearing from you soon.`,
    },
    resignation: {
      subject: 'Resignation - {{sender_name}}',
      body: `Please accept this letter as formal notification of my resignation from my position as {{current_position}} at {{company_name}}.

My last day of work will be {{last_day}}.

I want to thank you for the opportunities and support you have provided during my time here. I have enjoyed working with the team and appreciate the professional growth I have experienced.

I will ensure a smooth transition of my responsibilities before my departure.`,
    },
    sick_leave: {
      subject: 'Sick Leave Request - {{date}}',
      body: `I am writing to inform you that I am unable to attend work today, {{date}}, due to illness.

I expect to return to work on {{return_date}} and will keep you updated if there are any changes.

Please let me know if you need any additional information or if there are any urgent matters that require my attention during my absence.`,
    },
    vacation_request: {
      subject: 'Vacation Request - {{start_date}} to {{end_date}}',
      body: `I would like to request vacation leave from {{start_date}} to {{end_date}}.

I have {{days_requested}} days of vacation available and have made arrangements to ensure my responsibilities are covered during my absence.

I will complete all urgent tasks before my departure and provide a handover to my colleagues.

Please let me know if this request is approved.`,
    },
    meeting_request: {
      subject: 'Meeting Request - {{meeting_topic}}',
      body: `I would like to request a meeting to discuss {{meeting_topic}}.

I am available on the following dates and times:
{{available_times}}

Please let me know which time works best for you. If none of these times are suitable, I am happy to work around your schedule.

I look forward to our discussion.`,
    },
    project_update: {
      subject: 'Project Update - {{project_name}}',
      body: `I wanted to provide you with an update on the {{project_name}} project.

{{project_status}}

{{next_steps}}

Please let me know if you have any questions or would like to discuss any aspects of the project in more detail.`,
    },
    complaint: {
      subject: 'Complaint Regarding {{issue_topic}}',
      body: `I am writing to bring to your attention an issue regarding {{issue_topic}}.

{{issue_description}}

{{expected_resolution}}

I would appreciate your attention to this matter and look forward to a prompt resolution.`,
    },
    inquiry: {
      subject: 'Inquiry Regarding {{topic}}',
      body: `I am writing to inquire about {{topic}}.

{{specific_questions}}

I would be grateful if you could provide more information on these points. Please let me know if you need any additional details from my side.`,
    },
    apology: {
      subject: 'Apology - {{issue}}',
      body: `I would like to sincerely apologize for {{issue}}.

I understand that this has caused inconvenience, and I take full responsibility for the situation.

{{corrective_action}}

I assure you that this will not happen again, and I appreciate your understanding.`,
    },
    introduction: {
      subject: 'Introduction - {{sender_name}}',
      body: `I hope this email finds you well. My name is {{sender_name}}, and I am {{introduction_context}}.

{{background_information}}

I would welcome the opportunity to {{purpose_of_introduction}}.

I look forward to hearing from you.`,
    },
    payment_request: {
      subject: 'Payment Request - Invoice #{{invoice_number}}',
      body: `I am writing to follow up on payment for Invoice #{{invoice_number}}, dated {{invoice_date}}, in the amount of {{amount}}.

According to our records, this invoice is now {{days_overdue}} days overdue.

I would appreciate your prompt attention to this matter. Please let me know when I can expect payment or if there are any issues preventing payment.`,
    },
    deadline_extension: {
      subject: 'Request for Deadline Extension - {{project_name}}',
      body: `I am writing to request an extension for the deadline on {{project_name}}.

The current deadline is {{current_deadline}}, and I am requesting an extension to {{new_deadline}}.

{{reason_for_extension}}

I appreciate your consideration of this request.`,
    },
    collaboration: {
      subject: 'Collaboration Opportunity - {{topic}}',
      body: `I would like to propose a collaboration opportunity regarding {{topic}}.

{{collaboration_idea}}

{{mutual_benefits}}

I believe this collaboration could be mutually beneficial, and I would welcome the opportunity to discuss this further with you.`,
    },
    feedback_request: {
      subject: 'Request for Feedback - {{topic}}',
      body: `I would appreciate your feedback on {{topic}}.

{{specific_areas_for_feedback}}

Your insights would be valuable in helping me {{improvement_goal}}.

Thank you in advance for your time and consideration.`,
    },
    rejection: {
      subject: 'Thank You for Your Interest',
      body: `Thank you for your interest in {{opportunity}}.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We appreciate the time you invested in the application process and wish you the best in your future endeavors.`,
    },
    acceptance: {
      subject: 'Acceptance - {{opportunity}}',
      body: `I am pleased to accept the {{opportunity}} offer.

I am excited about this opportunity and look forward to {{next_steps}}.

Please let me know what steps I should take next and if there is any additional documentation or information you need from me.`,
    },
    rent_inquiry: {
      subject: 'Rental Inquiry - {{property_address}}',
      body: `I am writing to inquire about the rental property at {{property_address}}.

{{questions_about_property}}

I am interested in viewing the property and would appreciate information about {{viewing_availability}}.

Thank you for your time, and I look forward to hearing from you.`,
    },
    university_application: {
      subject: 'Application Inquiry - {{program_name}}',
      body: `I am writing to express my interest in the {{program_name}} program at {{university_name}}.

{{academic_background}}

{{reasons_for_interest}}

I would appreciate any information you can provide about the application process, admission requirements, and program details.

Thank you for your consideration.`,
    },
  }

  return templates[purpose] || templates.inquiry
}

/**
 * Fill template with values
 */
function fillTemplate(template: string, params: Record<string, any>): string {
  let result = template
  for (const [key, value] of Object.entries(params)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(placeholder, value || '')
  }
  return result
}

/**
 * Get greeting based on recipient and tone
 */
function getGreeting(recipientType: RecipientType, tone: Tone, recipientName?: string): string {
  if (recipientName) {
    if (tone === 'Formal') return `Dear ${recipientName},`
    if (tone === 'Professional') return `Hello ${recipientName},`
    if (tone === 'Friendly') return `Hi ${recipientName},`
    return `Dear ${recipientName},`
  }

  const greetings: Record<RecipientType, Record<Tone, string>> = {
    Manager: {
      Formal: 'Dear Sir/Madam,',
      Professional: 'Hello,',
      Friendly: 'Hi there,',
      Firm: 'Dear Manager,',
    },
    HR: {
      Formal: 'Dear HR Department,',
      Professional: 'Hello,',
      Friendly: 'Hi,',
      Firm: 'Dear HR Team,',
    },
    Client: {
      Formal: 'Dear Valued Client,',
      Professional: 'Hello,',
      Friendly: 'Hi there,',
      Firm: 'Dear Client,',
    },
    University: {
      Formal: 'Dear Admissions Office,',
      Professional: 'Hello,',
      Friendly: 'Hi,',
      Firm: 'Dear Sir/Madam,',
    },
    Landlord: {
      Formal: 'Dear Property Manager,',
      Professional: 'Hello,',
      Friendly: 'Hi,',
      Firm: 'Dear Landlord,',
    },
    Other: {
      Formal: 'Dear Sir/Madam,',
      Professional: 'Hello,',
      Friendly: 'Hi,',
      Firm: 'Dear Sir/Madam,',
    },
  }

  return greetings[recipientType]?.[tone] || 'Hello,'
}

/**
 * Get closing based on tone
 */
function getClosing(tone: Tone): string {
  const closings: Record<Tone, string> = {
    Formal: 'Yours sincerely,',
    Professional: 'Best regards,',
    Friendly: 'Best,',
    Firm: 'Sincerely,',
  }
  return closings[tone] || 'Best regards,'
}

/**
 * Get signature
 */
function getSignature(name: string, role?: string, phone?: string): string {
  const parts = [name]
  if (role) parts.push(role)
  if (phone) parts.push(`Phone: ${phone}`)
  return parts.join('\n')
}

