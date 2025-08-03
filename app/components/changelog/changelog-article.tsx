import { useEffect, useRef, useState } from 'react'
import { Link } from '@remix-run/react'
import clsx from 'clsx'
import { marked } from 'marked'
import { Chip } from '@heroui/react'
import { Changelog } from '~/types/changelog'
import { FormattedDate } from './FormattedDate'
import { SparkleIcon } from './SparkleIcon'

interface ChangelogArticleProps {
  changelog: Changelog
  index: number
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
            className="hidden xl:pointer-events-auto xl:block xl:text-2xs/4 xl:font-medium xl:text-primary-500"
          />
        </Link>
        <div className="h-[0.0625rem] w-3.5 bg-primary-500 lg:-mr-3.5 xl:mr-0 xl:bg-primary-500" />
      </div>
      <ContentWrapper>
        <div className="flex">
          <Link to={`#${id}`} className="inline-flex">
            <FormattedDate
              date={date}
              className="text-2xs/4 font-medium text-primary-500 xl:hidden"
            />
          </Link>
        </div>
      </ContentWrapper>
    </header>
  )
}

export default function ChangelogArticle({ changelog, index }: ChangelogArticleProps) {
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

  // Create a unique ID for the changelog entry
  const articleId = `changelog-${changelog.id || index}`

  // Configure marked for better rendering
  const parseMarkdown = (content: string) => {
    if (!content) return ''

    try {
      // Configure marked options for better rendering
      marked.setOptions({
        breaks: true, // Convert \n to <br>
        gfm: true, // GitHub Flavored Markdown
      })

      // Process the markdown content
      let html = String(marked(content))

      // First, handle multiple images in the same paragraph (same line in markdown)
      html = html.replace(
        /<p>([^<]*<img[^>]*>[^<]*){2,}<\/p>/g,
        (match) => {
          // Extract all images from the paragraph
          const images = match.match(/<img[^>]*>/g) || []
          
          if (images.length > 1) {
            // Multiple images in same paragraph - create horizontal scroll container
            const processedImages = images.map(img => 
              img.replace(
                /<img([^>]*?)src="([^"]*?)"([^>]*?)>/,
                '<img$1src="$2"$3 class="max-h-[512px] rounded-lg shadow-lg flex-shrink-0 w-auto h-auto" loading="lazy" alt="">'
              )
            ).join('')
            
            return `<div class="flex gap-4 overflow-x-auto py-4 my-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">${processedImages}</div>`
          }
          
          return match
        }
      )
      
      // Then handle consecutive single-image paragraphs
      html = html.replace(
        /(<p>\s*<img[^>]*>\s*<\/p>\s*)+/g,
        (match) => {
          // Extract all images from consecutive paragraphs
          const images = match.match(/<img[^>]*>/g) || []
          
          if (images.length === 1) {
            // Single image - keep original styling
            return match.replace(
              /<img([^>]*?)src="([^"]*?)"([^>]*?)>/g,
              '<img$1src="$2"$3 class="max-h-[512px] rounded-lg shadow-lg max-w-full h-auto my-4" loading="lazy" alt="">'
            )
          } else {
            // Multiple consecutive single-image paragraphs - create horizontal scroll container
            const processedImages = images.map(img => 
              img.replace(
                /<img([^>]*?)src="([^"]*?)"([^>]*?)>/,
                '<img$1src="$2"$3 class="max-h-[512px] rounded-lg shadow-lg flex-shrink-0 w-auto h-auto" loading="lazy" alt="">'
              )
            ).join('')
            
            return `<div class="flex gap-4 overflow-x-auto py-4 my-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">${processedImages}</div>`
          }
        }
      )
      
      // Handle any remaining single images that weren't in paragraphs
      html = html.replace(
        /<img([^>]*?)src="([^"]*?)"([^>]*?)>(?![^<]*<\/div>)/g,
        '<img$1src="$2"$3 class="max-h-[512px] rounded-lg shadow-lg max-w-full h-auto my-4" loading="lazy" alt="">'
      )

      // Improve heading styling
      html = html.replace(
        /<h([1-6])([^>]*?)>/g,
        '<h$1$2 class="font-semibold text-white mb-4 mt-6">'
      )

      // Improve paragraph styling
      html = html.replace(
        /<p([^>]*?)>/g,
        '<p$1 class="mb-4 text-gray-300 leading-relaxed">'
      )

      // Improve list styling
      html = html.replace(
        /<ul([^>]*?)>/g,
        '<ul$1 class="list-disc list-inside mb-4 space-y-2 text-gray-300">'
      )

      html = html.replace(
        /<ol([^>]*?)>/g,
        '<ol$1 class="list-decimal list-inside mb-4 space-y-2 text-gray-300">'
      )

      // Improve code styling
      html = html.replace(
        /<code([^>]*?)>/g,
        '<code$1 class="bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm font-mono">'
      )

      // Improve blockquote styling
      html = html.replace(
        /<blockquote([^>]*?)>/g,
        '<blockquote$1 class="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-4">'
      )

      return html
    } catch (error) {
      console.error('Error parsing markdown:', error)
      // Fallback to plain text with line breaks
      return content.replace(/\n/g, '<br>')
    }
  }

  const htmlContent = parseMarkdown(changelog.content || '')

  return (
    <article
      id={articleId}
      className="scroll-mt-16"
      style={{ paddingBottom: `${heightAdjustment}px` }}
    >
      <div ref={heightRef}>
        <ArticleHeader id={articleId} date={changelog.release_date} />
        <ContentWrapper className="typography" data-mdx-content>
          {/* Title */}
          <h2 className="text-2xl font-display font-semibold text-white mb-2">
            {changelog.title}
          </h2>

          {/* Version info if available */}
          {changelog.version && (
            <div className="font-mono mb-6 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sky-500/10 text-sky-300 border border-sky-500/60">
              Version {changelog.version}
            </div>
          )}

          {/* Tags/Categories as Improvements */}
          {changelog.tags && changelog.tags.length > 0 && (
            <div className="mt-0">
              <div className="flex flex-wrap gap-2">
                <SparkleIcon className="mr-2 w-5 h-5" />
                {changelog.tags.map((tag, tagIndex) => (
                  <Chip
                    key={tagIndex}
                    classNames={{
                      base: "bg-gradient-to-br from-secondary-300 to-secondary-500 border-small border-secondary-400 shadow-primary-500/20 overflow-clip",
                      content: "drop-shadow-sm shadow-black text-white font-medium",
                    }}
                    variant="shadow"
                    size="sm"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {changelog.content && (
            <div className="mb-8">
              <div
                className="typography prose prose-invert prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          )}

          {/* Debug info - remove this later */}
          {!changelog.content && (
            <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-300 text-sm">
                Debug: No content found for this changelog entry.
              </p>
              <pre className="text-xs text-yellow-200 mt-2">
                {JSON.stringify({
                  id: changelog.id,
                  title: changelog.title,
                  hasContent: !!changelog.content,
                  contentLength: changelog.content?.length || 0,
                  tags: changelog.tags
                }, null, 2)}
              </pre>
            </div>
          )}

        </ContentWrapper>
      </div>
    </article>
  )
}
