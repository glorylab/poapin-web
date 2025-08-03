import { useEffect, useRef, useState } from 'react'
import { Link } from '@remix-run/react'
import clsx from 'clsx'
import { FormattedDate } from './FormattedDate'

type ImagePropsWithOptionalAlt = React.ImgHTMLAttributes<HTMLImageElement> & { alt?: string }

export const img = function Img(props: ImagePropsWithOptionalAlt) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900">
      <img
        alt=""
        {...props}
        className="w-full h-auto"
      />
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-gray-900/10 ring-inset dark:ring-white/10" />
    </div>
  )
}

function ContentWrapper({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:flex lg:px-8">
      <div className="lg:ml-96 lg:flex lg:w-full lg:justify-end lg:pl-32">
        <div
          className={clsx(
            'mx-auto max-w-lg lg:mx-0 lg:w-0 lg:max-w-xl lg:flex-auto',
            className,
          )}
          {...props}
        />
      </div>
    </div>
  )
}

function ArticleHeader({ id, date }: { id: string; date: string | Date }) {
  return (
    <header className="relative mb-10 xl:mb-0">
      <div className="pointer-events-none absolute top-0 left-[max(-0.5rem,calc(50%-18.625rem))] z-50 flex h-4 items-center justify-end gap-x-2 lg:right-[calc(max(2rem,50%-38rem)+40rem)] lg:left-0 lg:min-w-lg xl:h-8">
        <Link to={`#${id}`} className="inline-flex">
          <FormattedDate
            date={date}
            className="text-2xs/4 font-medium text-gray-500"
          />
        </Link>
        <div className="h-[0.0625rem] w-3.5 bg-gray-400 dark:bg-gray-500" />
        <div className="flex h-1.5 w-1.5 items-center justify-center">
          <div className="h-0.5 w-0.5 rounded-full bg-gray-400 dark:bg-gray-500" />
        </div>
      </div>
    </header>
  )
}

export const article = function Article({
  id,
  date,
  children,
}: {
  id: string
  date: string | Date
  children: React.ReactNode
}) {
  let heightRef = useRef<React.ElementRef<'div'>>(null)
  let [heightAdjustment, setHeightAdjustment] = useState(0)

  useEffect(() => {
    if (!heightRef.current) {
      return
    }

    let observer = new window.ResizeObserver(() => {
      if (!heightRef.current) {
        return
      }
      let { height } = heightRef.current.getBoundingClientRect()
      let nextMultipleOf8 = 8 * Math.ceil(height / 8)
      setHeightAdjustment(nextMultipleOf8 - height)
    })

    observer.observe(heightRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <article
      id={id}
      className="scroll-mt-16"
      style={{ paddingBottom: `${heightAdjustment}px` }}
    >
      <div ref={heightRef}>
        <ArticleHeader id={id} date={date} />
        <ContentWrapper className="typography" data-mdx-content>
          {children}
        </ContentWrapper>
      </div>
    </article>
  )
}

export const code = function Code({
  highlightedCode,
  ...props
}: React.ComponentPropsWithoutRef<'code'> & { highlightedCode?: string }) {
  if (highlightedCode) {
    return (
      <code
        {...props}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    )
  }

  return <code {...props} />
}
