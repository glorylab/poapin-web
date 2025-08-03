import { useId, useEffect, useState } from 'react'
import { ChangelogIntro, ChangelogIntroFooter } from './ChangelogIntro'

function Timeline() {
  let id = useId()

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden lg:right-[calc(max(2rem,50%-38rem)+40rem)] lg:min-w-lg lg:overflow-visible">
      <svg
        className="absolute top-0 left-[max(0px,calc(50%-18.125rem))] h-full w-1.5 lg:left-full lg:ml-1 xl:right-1 xl:left-auto xl:ml-0"
        aria-hidden="true"
      >
        <defs>
          <pattern id={id} width="6" height="8" patternUnits="userSpaceOnUse">
            <path
              d="M0 0H6M0 8H6"
              className="stroke-primary-500/10 xl:stroke-white/10"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  )
}

function Glow() {
  let id = useId()

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-background-600 lg:right-[calc(max(2rem,50%-38rem)+40rem)] lg:min-w-lg">
      <svg
        className="absolute -bottom-48 left-[-40%] h-320 w-[180%] lg:top-[-40%] lg:-right-40 lg:bottom-auto lg:left-auto lg:h-[180%] lg:w-7xl"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${id}-desktop`} cx="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="53.95%" stopColor="rgba(255, 255, 255, 0.09)" />
            <stop offset="100%" stopColor="rgba(10, 14, 23, 0)" />
          </radialGradient>
          <radialGradient id={`${id}-mobile`} cy="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="53.95%" stopColor="rgba(255, 255, 255, 0.09)" />
            <stop offset="100%" stopColor="rgba(10, 14, 23, 0)" />
          </radialGradient>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-desktop)`}
          className="hidden lg:block"
        />
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-mobile)`}
          className="lg:hidden"
        />
      </svg>
      <div className="absolute inset-x-0 right-0 bottom-0 h-px bg-white mix-blend-overlay lg:top-0 lg:left-auto lg:h-auto lg:w-px" />
    </div>
  )
}

function FixedSidebar({
  main,
  footer,
}: {
  main: React.ReactNode
  footer: React.ReactNode
}) {
  const [bottomOffset, setBottomOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Find the global footer element
      const globalFooter = document.querySelector('footer')
      if (!globalFooter) return

      const footerRect = globalFooter.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      
      // If footer is visible (top of footer is above bottom of viewport)
      if (footerRect.top < viewportHeight) {
        // Calculate how much the footer is overlapping with the viewport
        const overlap = viewportHeight - footerRect.top
        setBottomOffset(overlap)
      } else {
        setBottomOffset(0)
      }
    }

    // Initial check
    handleScroll()

    // Add scroll listener
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <div 
      className="relative flex-none overflow-hidden px-0 lg:pointer-events-none lg:fixed lg:inset-0 lg:z-40 lg:flex lg:px-0 shadow-lg lg:shadow-none"
      style={{
        bottom: bottomOffset > 0 ? `${bottomOffset}px` : '0'
      }}
    >
      <Glow />
      <div className="relative flex w-full lg:pointer-events-auto lg:mr-[calc(max(2rem,50%-38rem)+40rem)] lg:min-w-lg lg:overflow-x-hidden lg:overflow-y-auto lg:pl-[max(4rem,calc(50%-38rem))] bg-background-600 lg:bg-transparent">
        <div className="mx-auto max-w-lg lg:mx-0 lg:flex lg:w-96 lg:max-w-none lg:flex-col lg:before:flex-1 lg:before:pt-6">
          <div className="pt-20 pb-16 sm:pt-32 sm:pb-20 lg:py-20">
            <div className="relative">
              {main}
            </div>
          </div>
          <div className="flex flex-1 items-end justify-center pb-4 lg:justify-start lg:pb-6">
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FixedSidebar main={<ChangelogIntro />} footer={<ChangelogIntroFooter />} />
      <div className="relative flex-auto">
        <Timeline />
        <main className='py-16 bg-background-500'>
          {children}
        </main>
      </div>
    </>
  )
}
