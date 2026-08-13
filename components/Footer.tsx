import Link from 'next/link'
import CookieSettingsButton from '@/components/CookieSettingsButton'

export function Footer() {
  return (
    <footer className="border-t border-foreground/10 mt-auto" data-no-translate>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-70">
          <p>© {new Date().getFullYear()} JobAZ</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-violet-600 dark:hover:text-violet-400 hover:underline transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-violet-600 dark:hover:text-violet-400 hover:underline transition-colors"
            >
              Terms & Conditions
            </Link>
            <CookieSettingsButton className="hover:text-violet-600 dark:hover:text-violet-400 hover:underline transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  )
}
