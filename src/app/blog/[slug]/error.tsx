'use client';

export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Blog Article Error</h1>
      <p><strong>Message:</strong> {error.message}</p>
      <p><strong>Digest:</strong> {error.digest}</p>
      <pre style={{ background: "#f0f0f0", padding: "1rem", overflow: "auto" }}>
        {error.stack}
      </pre>
    </div>
  );
}
