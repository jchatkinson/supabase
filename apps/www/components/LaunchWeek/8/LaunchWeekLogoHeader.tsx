import classNames from 'classnames'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useBreakpoint } from 'common/hooks/useBreakpoint'

export function LaunchWeekLogoHeader() {
  const isMobile = useBreakpoint(640)

  return (
    <div className="flex flex-col gap-1 md:gap-2 items-center justify-end">
      <div className="opacity-0 !animate-[fadeIn_0.5s_cubic-bezier(0.25,0.25,0,1)_0.5s_both] flex flex-col items-center text-center gap-3">
        <h1 className="sr-only font-normal uppercase text-[28px] sm:text-[32px]">Launch week 8</h1>
        <p className="text-white radial-gradient-text-scale-600 text-lg sm:text-2xl">
          <span className="block">August 7th–11th, 2023</span>
          <span>10:00 AM PT</span>
        </p>
        <div className="text-[#9296AA]">
          Join us in a week of announcing new features. <br className="hidden md:block" />
          {/* Generate and share your unique ticket to win swag and help us complete the 8. */}
          Connect with Github to generate your unique ticket and contribute to the 8️⃣ shape.
        </div>
      </div>
    </div>
  )
}