import { CvData } from '@/app/cv-builder-v2/page'

interface PersonalInfoTabProps {
  personalInfo: CvData['personalInfo']
  onUpdate: (updates: Partial<CvData['personalInfo']>) => void
}

export default function PersonalInfoTab({ personalInfo, onUpdate }: PersonalInfoTabProps) {
  const safePersonalInfo = personalInfo ?? { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '' }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
        <input
          type="text"
          value={safePersonalInfo.fullName}
          onChange={(e) => onUpdate({ fullName: e.target.value })}
          className="jobaz-input w-full"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
        <input
          type="email"
          value={safePersonalInfo.email}
          onChange={(e) => onUpdate({ email: e.target.value })}
          className="jobaz-input w-full"
          placeholder="john.doe@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
        <input
          type="tel"
          value={safePersonalInfo.phone || ''}
          onChange={(e) => onUpdate({ phone: e.target.value })}
          className="jobaz-input w-full"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Location</label>
        <input
          type="text"
          value={safePersonalInfo.location || ''}
          onChange={(e) => onUpdate({ location: e.target.value })}
          className="jobaz-input w-full"
          placeholder="City, Country"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">LinkedIn</label>
        <input
          type="url"
          value={safePersonalInfo.linkedin || ''}
          onChange={(e) => onUpdate({ linkedin: e.target.value })}
          className="jobaz-input w-full"
          placeholder="linkedin.com/in/yourprofile"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Website / Portfolio</label>
        <input
          type="url"
          value={safePersonalInfo.website || ''}
          onChange={(e) => onUpdate({ website: e.target.value })}
          className="jobaz-input w-full"
          placeholder="yourwebsite.com"
        />
      </div>
    </div>
  )
}

