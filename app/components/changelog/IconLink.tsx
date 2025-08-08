import { Link } from '@remix-run/react'
import clsx from 'clsx'

export function IconLink({
  children,
  className,
  compact = false,
  alt,
  icon: Icon,
  to,
  ...props
}: {
  children?: React.ReactNode
  className?: string
  compact?: boolean
  alt?: string
  icon?: React.ComponentType<{ className?: string }>
  to: string
} & Omit<React.ComponentPropsWithoutRef<'a'>, 'href'>) {
  const isExternal = to.startsWith('http') || to.startsWith('mailto:')
  
  const linkClasses = clsx(
    className,
    'transition-all group relative isolate flex items-center justify-center rounded-lg text-[0.8125rem]/6 font-medium text-white/30 transition-colors hover:text-sky-300 active:text-sky-200 focus:text-sky-200 active:scale-95 focus:scale-95',
    compact ? 'px-2 py-1 gap-x-2' : 'px-4 py-3 gap-x-3 w-12 h-12',
  )

  const content = (
    <>
      <span className="absolute inset-0 -z-10 scale-75 rounded-lg bg-white/5 opacity-0 transition group-hover:scale-100 group-hover:opacity-100" />
      {Icon && <Icon className={compact ? "h-4 w-4 flex-none" : "h-5 w-5 flex-none"} />}
      {children && <span className="self-baseline text-white">{children}</span>}
    </>
  )

  if (isExternal) {
    return (
      <a
        href={to}
        className={linkClasses}
        target="_blank"
        title={alt}
        rel="noopener noreferrer"
        {...props}
      >
        {content}
      </a>
    )
  }

  return (
    <Link
      to={to}
      className={linkClasses}
      title={alt}
      {...props}
    >
      {content}
    </Link>
  )
}
