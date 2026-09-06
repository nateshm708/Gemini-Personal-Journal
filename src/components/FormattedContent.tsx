import React from 'react';
import Markdown from 'react-markdown';

interface FormattedContentProps {
  content: string;
  className?: string;
  isAi?: boolean;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({
  content,
  className = '',
  isAi = false,
}) => {
  return (
    <div
      className={`prose-editorial text-base sm:text-lg leading-relaxed font-serif text-[#1a1a1a] ${
        isAi ? 'italic' : ''
      } ${className}`}
    >
      <Markdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-serif font-normal text-[#1a1a1a] mt-4 mb-2 not-italic">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg sm:text-xl font-serif font-normal text-[#1a1a1a] mt-3 mb-2 not-italic">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#1a1a1a] mt-3 mb-1.5 not-italic tracking-normal">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm sm:text-base font-serif font-bold text-[#1a1a1a] mt-2 mb-1 not-italic">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-3.5 last:mb-0 leading-relaxed text-[#1a1a1a]">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[#1a1a1a] not-italic">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-3 space-y-1.5 marker:text-[#1a1a1a]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-3 space-y-1.5 marker:text-[#1a1a1a]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1 text-[#1a1a1a]">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#1a1a1a] pl-4 italic text-[#4a453e] my-3">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-[#e5e1da]/60 px-1.5 py-0.5 rounded-xs text-[11px] font-mono text-[#1a1a1a] not-italic">
              {children}
            </code>
          ),
          hr: () => <hr className="border-t border-[#e5e1da] my-4" />,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
