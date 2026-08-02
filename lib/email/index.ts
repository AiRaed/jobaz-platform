export {
  getEmailConfigStatus,
  getResendClient,
  type EmailConfigStatus,
} from './resendClient'

export {
  buildEmailTemplate,
  getTemplateMeta,
  EMAIL_TEMPLATE_OPTIONS,
  type EmailTemplateKey,
  type EmailType,
  type TemplateContext,
  type BuiltEmail,
} from './templates'

export {
  sendJobazEmail,
  previewEmail,
  unsubscribeByToken,
  type SendEmailInput,
  type SendEmailResult,
} from './sendEmail'
