import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps = {}) {
  return (
    <img
      src="/logo.png"
      alt="JobAZ Logo"
      width={140}
      height={40}
      className={cn(
        'jobaz-logo jobaz-logo--header h-10 md:h-14 lg:h-16 w-auto object-contain select-none',
        className
      )}
      draggable="false"
    />
  )
}

