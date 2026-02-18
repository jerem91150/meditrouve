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

export default function BlogArticleContent({
  slug,
  publicContent,
  publicExcerpt,
  publicReadTime,
  proContent,
  proExcerpt,
  proReadTime,
  viewCountPublic,
  viewCountPro,
}: Props) {
  const [version, setVersion] = useState<'public' | 'pro'>('public');
  const [viewTracked, setViewTracked] = useState(false);

  const isPublic = version === 'public';
  const content = isPublic ? publicContent : proContent;
  const excerpt = isPublic ? publicExcerpt : proExcerpt;
  const readTime = isPublic ? publicReadTime : proReadTime;

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
    setViewTracked(false);
  };

  const html = markdownToHtml(content);

  return (
    <div>
      {/* Toggle Version */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => handleVersionChange('public')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isPublic
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Grand Public
          </button>
          <button
            onClick={() => handleVersionChange('pro')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              !isPublic
                ? 'bg-green-600 text-white shadow-md shadow-green-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Professionnels
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{readTime} min</span>
          <span>·</span>
          <span>{isPublic ? viewCountPublic : viewCountPro} vues</span>
        </div>
      </div>

      {/* Version Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 ${
        isPublic
          ? 'bg-blue-50 text-blue-700 border border-blue-100'
          : 'bg-green-50 text-green-700 border border-green-100'
      }`}>
        <div className={`w-2 h-2 rounded-full ${isPublic ? 'bg-blue-500' : 'bg-green-500'}`}></div>
        {isPublic ? 'Version simplifiée · Accessible à tous' : 'Version détaillée · Professionnels de santé'}
      </div>

      {/* Excerpt */}
      <div className="bg-slate-50 border-l-4 border-blue-500 p-4 rounded-r-xl mb-8">
        <p className="text-slate-600 leading-relaxed italic">
          {excerpt}
        </p>
      </div>

      {/* Article Content */}
      <div
        className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-100 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-4 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-800 prose-ul:mb-4 prose-ol:mb-4 prose-li:text-slate-600 prose-li:mb-1 prose-hr:my-8 prose-hr:border-slate-200"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const htmlLines: string[] = [];
  let inUl = false;
  let inOl = false;
  let inParagraph = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^---+$/.test(line.trim())) {
      if (inUl) { htmlLines.push('</ul>'); inUl = false; }
      if (inOl) { htmlLines.push('</ol>'); inOl = false; }
      if (inParagraph) { htmlLines.push('</p>'); inParagraph = false; }
      htmlLines.push('<hr/>');
      continue;
    }

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

    const ul = line.match(/^[-*] (.+)$/);
    if (ul) {
      if (inOl) { htmlLines.push('</ol>'); inOl = false; }
      if (inParagraph) { htmlLines.push('</p>'); inParagraph = false; }
      if (!inUl) { htmlLines.push('<ul>'); inUl = true; }
      htmlLines.push(`<li>${inlineFormat(ul[1])}</li>`);
      continue;
    }

    const ol = line.match(/^\d+\. (.+)$/);
    if (ol) {
      if (inUl) { htmlLines.push('</ul>'); inUl = false; }
      if (inParagraph) { htmlLines.push('</p>'); inParagraph = false; }
      if (!inOl) { htmlLines.push('<ol>'); inOl = true; }
      htmlLines.push(`<li>${inlineFormat(ol[1])}</li>`);
      continue;
    }

    if (line.trim() === '') {
      if (inUl) { htmlLines.push('</ul>'); inUl = false; }
      if (inOl) { htmlLines.push('</ol>'); inOl = false; }
      if (inParagraph) { htmlLines.push('</p>'); inParagraph = false; }
      continue;
    }

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
