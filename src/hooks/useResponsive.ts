import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export function useResponsive(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < 768) {
        setBreakpoint('mobile')
      } else if (width < 1024) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('desktop')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}

export function useIsMobile(): boolean {
  const breakpoint = useResponsive()
  return breakpoint === 'mobile'
}

export function useIsTablet(): boolean {
  const breakpoint = useResponsive()
  return breakpoint === 'tablet'
}

export function useIsDesktop(): boolean {
  const breakpoint = useResponsive()
  return breakpoint === 'desktop'
}

