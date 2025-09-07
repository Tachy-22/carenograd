'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github-dark.css'

interface MarkdownContentProps {
  children: string
  className?: string
}

export default function MarkdownContent({ children, className = '' }: MarkdownContentProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Links
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
              {...props}
            >
              {children}
            </a>
          ),

          // Headers
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold mb-4 mt-8 first:mt-0" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-semibold mb-3 mt-6 first:mt-0" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-semibold mb-3 mt-8 first:mt-0" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-base font-semibold mb-2 mt-6 first:mt-0" {...props}>
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children, ...props }) => (
            <p className="mb-2 leading-relaxed" {...props}>
              {children}
            </p>
          ),

          // Lists
          ul: ({ children, ...props }) => (
            <ul className="list-disc mb-2 space-y-2 ml-8 pl-4 marker:text-gray-500" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal mb-2 space-y-2 ml-8 pl-4 marker:text-gray-500" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed pl-3" {...props}>
              {children}
            </li>
          ),

          // Code blocks
          pre: ({ children, ...props }) => (
            <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4 overflow-x-auto text-sm" {...props}>
              {children}
            </pre>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className?.includes('language-')
            return isInline ? (
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className="font-mono text-sm" {...props}>
                {children}
              </code>
            )
          },

          // Tables
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-gray-50 dark:bg-gray-700" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="border-b border-gray-300 dark:border-gray-600" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2" {...props}>
              {children}
            </td>
          ),

          // Blockquotes
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-700 dark:text-gray-300" {...props}>
              {children}
            </blockquote>
          ),

          // Horizontal rules
          hr: ({ ...props }) => (
            <hr className="my-6 border-t border-gray-300 dark:border-gray-600" {...props} />
          ),

          // Strong/Bold
          strong: ({ children, ...props }) => (
            <strong className="font-semibold" {...props}>
              {children}
            </strong>
          ),

          // Emphasis/Italic
          em: ({ children, ...props }) => (
            <em className="italic" {...props}>
              {children}
            </em>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}