'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) return null;

  // Split into blocks (code blocks vs markdown text)
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';
  let codeBlockIndex = 0;

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listIsOrdered = false;

  const flushList = () => {
    if (inList && listItems.length > 0) {
      if (listIsOrdered) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-3 space-y-1.5 pl-6 list-decimal text-slate-700 leading-relaxed">
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-3 space-y-1.5 pl-6 list-disc text-slate-700 leading-relaxed">
            {listItems}
          </ul>
        );
      }
      listItems = [];
      inList = false;
    }
  };

  const renderInline = (text: string): React.ReactNode => {
    // Process inline markdown: links, bold, italic, code
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Pattern for markdown links: [label](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
    // Pattern for inline code: `code`
    const codeRegex = /`([^`]+)`/;
    // Pattern for bold: **text**
    const boldRegex = /\*\*([^*]+)\*\*/;
    // Pattern for italic: *text*
    const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/;

    while (remaining.length > 0) {
      const matchLink = remaining.match(linkRegex);
      const matchCode = remaining.match(codeRegex);
      const matchBold = remaining.match(boldRegex);
      const matchItalic = remaining.match(italicRegex);

      // Find earliest match
      const matches = [
        matchLink ? { type: 'link', match: matchLink, index: matchLink.index! } : null,
        matchCode ? { type: 'code', match: matchCode, index: matchCode.index! } : null,
        matchBold ? { type: 'bold', match: matchBold, index: matchBold.index! } : null,
        matchItalic ? { type: 'italic', match: matchItalic, index: matchItalic.index! } : null,
      ].filter(Boolean) as { type: string; match: RegExpMatchArray; index: number }[];

      if (matches.length === 0) {
        parts.push(remaining);
        break;
      }

      matches.sort((a, b) => a.index - b.index);
      const first = matches[0];

      if (first.index > 0) {
        parts.push(remaining.slice(0, first.index));
      }

      if (first.type === 'link') {
        const label = first.match[1];
        const url = first.match[2];
        const isExternal = url.startsWith('http://') || url.startsWith('https://');
        parts.push(
          <a
            key={`inline-${keyIdx++}`}
            href={url}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="text-electric-blue hover:text-electric-cyan underline underline-offset-2 font-medium inline-flex items-center gap-0.5"
          >
            {label}
            {isExternal && <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-80" />}
          </a>
        );
      } else if (first.type === 'code') {
        parts.push(
          <code
            key={`inline-${keyIdx++}`}
            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[13px] font-mono border border-slate-200/80"
          >
            {first.match[1]}
          </code>
        );
      } else if (first.type === 'bold') {
        parts.push(
          <strong key={`inline-${keyIdx++}`} className="font-semibold text-slate-900">
            {first.match[1]}
          </strong>
        );
      } else if (first.type === 'italic') {
        parts.push(
          <em key={`inline-${keyIdx++}`} className="italic">
            {first.match[1]}
          </em>
        );
      }

      remaining = remaining.slice(first.index + first.match[0].length);
    }

    return parts.length === 1 ? parts[0] : <React.Fragment>{parts}</React.Fragment>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        const codeText = codeBuffer.join('\n');
        const currentIndex = codeBlockIndex++;
        elements.push(
          <div key={`code-${currentIndex}`} className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-[#0c1524] shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-[#080e18] border-b border-slate-800 text-xs text-slate-400 font-mono">
              <span className="uppercase tracking-wider font-semibold text-electric-cyan/90">
                {codeLang || 'CODE'}
              </span>
              <button
                onClick={() => copyCode(codeText, currentIndex)}
                type="button"
                className="flex items-center gap-1.5 hover:text-white transition-colors py-0.5 px-2 rounded hover:bg-white/10"
              >
                {copiedIndex === currentIndex ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-sans">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="font-sans">Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
        codeLang = '';
      } else {
        flushList();
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-6 mb-3 tracking-tight">
          {renderInline(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl sm:text-2xl font-bold text-slate-900 mt-5 mb-2.5 tracking-tight border-b border-slate-200/60 pb-2">
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg sm:text-xl font-bold text-slate-900 mt-4 mb-2 tracking-tight">
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="text-base sm:text-lg font-semibold text-slate-800 mt-3 mb-1.5">
          {renderInline(line.slice(5))}
        </h4>
      );
      continue;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={`quote-${i}`} className="my-3 pl-4 border-l-4 border-electric-blue bg-electric-ice/30 py-2 pr-3 rounded-r-lg italic text-slate-700">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList || listIsOrdered) {
        flushList();
        inList = true;
        listIsOrdered = false;
      }
      listItems.push(
        <li key={`li-${i}`} className="pl-1">
          {renderInline(line.trim().slice(2))}
        </li>
      );
      continue;
    }

    // Ordered lists
    const olMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!inList || !listIsOrdered) {
        flushList();
        inList = true;
        listIsOrdered = true;
      }
      listItems.push(
        <li key={`li-${i}`} className="pl-1">
          {renderInline(olMatch[2])}
        </li>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="my-3 text-slate-700 leading-relaxed text-sm sm:text-base">
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  return <div className={`markdown-body ${className}`}>{elements}</div>;
}
