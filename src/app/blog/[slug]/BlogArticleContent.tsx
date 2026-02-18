'use client';

import { useState, useEffect } from 'react';

interface Props {
  slug: string;
  publicTitle: string;
  publicContent: string;
  publicExcerpt: string;
  publicReadTime: number;
  proTitle: string;
  proContent: string;
  proExcerpt: string;
  proReadTime: number;
  viewCountPublic: number;
  viewCountPro: number;
}

/**
 * Composant client pour le toggle Grand Public / Professionnels
 */
export default function BlogArticleContent({
  slug,
  publicTitle,
  publicContent,
  publicExcerpt,
  publicReadTime,
  proTitle,
  proContent,
  proExcerpt,
  proReadTime,
  viewCountPublic,
  viewCountPro,
}: Props) {
  const [version, setVersion] = useState<'public' | 'pro'>('public');
  const [viewTracked, setViewTracked] = useState(false);
  const [sanitizedHtml, setSanitizedHtml] = useState('');

  const isPublic = version === 'public';
  const title = isPublic ? publicTitle : proTitle;
  const content = isPublic ? publicContent : proContent;
  const excerpt = isPublic ? publicExcerpt : proExcerpt;
  const readTime = isPublic ? publicReadTime : proReadTime;

  // Track view on mount and version change
  useEffect(() => {
    if (!viewTracked) {
      fetch('/api/blog/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, version }),
      }).catch(() => {});
      setViewTracked(true);
    }
  }, [slug, version, viewTracked]);

  // Sanitize HTML on client side only (avoids jsdom SSR issues on Vercel)
  useEffect(() => {
    const html = markdownToHtml(content);
    import('dompurify').then((DOMPurify) => {
      setSanitizedHtml(DOMPurify.default.sanitize(html, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'hr', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      }));
    });
  }, [content]);

  const handleVersionChange = (v: 'public' | 'pro') => {
    setVersion(v);
    setViewTracked(false);
  };

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => handleVersionChange('public')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            isPublic
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Grand Public
        </button>
        <button
          onClick={() => handleVersionChange('pro')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            !isPublic
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Professionnels
        </button>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <span>{readTime} min de lecture</span>
        <span>{isPublic ? viewCountPublic : viewCountPro} vues</span>
        <span className={`px-2 py-0.5 rounded text-xs ${
          isPublic ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
        }`}>
          {isPublic ? 'Version simplifiée' : 'Version professionnelle'}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
        {title}
      </h1>

      {/* Excerpt */}
      <p className="text-lg text-gray-600 mb-6 leading-relaxed">
        {excerpt}
      </p>

      {/* Content */}
      {sanitizedHtml ? (
        <div
          className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-strong:text-gray-900 prose-li:text-gray-700 prose-h2:mt-8 prose-h2:mb-4 prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4 prose-ul:mb-4 prose-ol:mb-4 prose-li:mb-1 prose-hr:my-8"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      ) : (
        <div className="prose prose-gray max-w-none">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Markdown to HTML converter
 */
function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const htmlLines: string[] = [];
  let inUl = false;
  let inOl = false;
  let inParagraph = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      if (inUl) { htmlLines.push('</ul>'); inUl = false; }
      if (inOl) { htmlLines.push('</ol>'); inOl = false; }
      if (inParagraph) { htmlLines.push('</p>'); inParagraph = false; }
      htmlLines.push('<hr/>');
      continue;
    }

    // Headers
    const h4 = line.match(/^#### (.+)$/);
    if (h4) {
      if (inUl) { htmlLines.push('</ul>'); inUl = false; }
      if (inOl) { htmlLines.push('</ol>'); inOl = false; }
      if (inParagraph) { htmlLines.push('</p>'); inParagraph = false; }
      htmlLines.push(`<h4>${inlineFormat(h4[1])}</h4>`);
      continue;
    }
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      if (inUl) { htmlLines.push('</ul>'); inUl = false; }
      if (inOl) { htmlLines.push('</ol>'); inOl = false; }
      if (inParagraph) { htmlLines.push('</p>'); inParagraph = false; }
      htmlLines.push(`<h3>${inlineFormat(h3[1])}</h3>`);
      continue;
    }
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      if (inUl) { htmlLines.push('</ul>'); inUl = false; }
      if (inOl) { htmlLines.push('</ol>'); inOl = false; }
      if (inParagraph) { htmlLines.push('</p>'); inParagraph = false; }
      htmlLines.push(`<h2>${inlineFormat(h2[1])}</h2>`);
      continue;
    }
    const h1 = line.match(/^# (.+)$/);
    if (h1) {
      if (inUl) { htmlLines.push('</ul>'); inUl = false; }
      if (inOl) { htmlLines.push('</ol>'); inOl = false; }
      if (inParagraph) { htmlLines.push('</p>'); inParagraph = false; }
      htmlLines.push(`<h1>${inlineFormat(h1[1])}</h1>`);
      continue;
    }

    // Unordered list items
    const ul = line.match(/^[-*] (.+)$/);
    if (ul) {
      if (inOl) { htmlLines.push('</ol>'); inOl = false; }
      if (inParagraph) { htmlLines.push('</p>'); inParagraph = false; }
      if (!inUl) { htmlLines.push('<ul>'); inUl = true; }
      htmlLines.push(`<li>${inlineFormat(ul[1])}</li>`);
      continue;
    }

    // Ordered list items
    const ol = line.match(/^\d+\. (.+)$/);
    if (ol) {
      if (inUl) { htmlLines.push('</ul>'); inUl = false; }
      if (inParagraph) { htmlLines.push('</p>'); inParagraph = false; }
      if (!inOl) { htmlLines.push('<ol>'); inOl = true; }
      htmlLines.push(`<li>${inlineFormat(ol[1])}</li>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      if (inUl) { htmlLines.push('</ul>'); inUl = false; }
      if (inOl) { htmlLines.push('</ol>'); inOl = false; }
      if (inParagraph) { htmlLines.push('</p>'); inParagraph = false; }
      continue;
    }

    // Regular text (paragraph)
    if (!inParagraph) {
      htmlLines.push('<p>');
      inParagraph = true;
      htmlLines.push(inlineFormat(line));
    } else {
      htmlLines.push('<br/>' + inlineFormat(line));
    }
  }

  if (inUl) htmlLines.push('</ul>');
  if (inOl) htmlLines.push('</ol>');
  if (inParagraph) htmlLines.push('</p>');

  return htmlLines.join('\n');
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}
