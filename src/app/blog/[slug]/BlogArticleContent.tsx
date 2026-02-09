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
 * 🔄 Composant client pour le toggle Grand Public / Professionnels
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

  const handleVersionChange = (v: 'public' | 'pro') => {
    setVersion(v);
    setViewTracked(false); // Track new version view
  };

  const isPublic = version === 'public';
  const title = isPublic ? publicTitle : proTitle;
  const content = isPublic ? publicContent : proContent;
  const excerpt = isPublic ? publicExcerpt : proExcerpt;
  const readTime = isPublic ? publicReadTime : proReadTime;

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
          👥 Grand Public
        </button>
        <button
          onClick={() => handleVersionChange('pro')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            !isPublic
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🩺 Professionnels
        </button>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <span>⏱️ {readTime} min de lecture</span>
        <span>👁️ {isPublic ? viewCountPublic : viewCountPro} vues</span>
        <span className={`px-2 py-0.5 rounded text-xs ${
          isPublic ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
        }`}>
          {isPublic ? 'Version simplifiée' : 'Version détaillée'}
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

      {/* Content - rendered as simple markdown-like HTML */}
      <div
        className="prose prose-gray max-w-none
          prose-headings:text-gray-900
          prose-a:text-blue-600
          prose-strong:text-gray-900
          prose-li:text-gray-700"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
      />
    </div>
  );
}

/**
 * Simple markdown to HTML converter (no external dependency needed)
 */
function markdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br/>');

  // Wrap list items in ul
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul>$1</ul>');

  return `<p>${html}</p>`;
}
