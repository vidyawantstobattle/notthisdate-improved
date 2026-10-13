import { useMemo } from 'react';
import { sanitizeRichText } from '../utils/richText';

interface RichTextContentProps {
  html: string;
  className?: string;
}

// Re-sanitises at render time rather than trusting what the API returned, so a
// description that was stored before the rules tightened still can't inject.
function RichTextContent({ html, className }: RichTextContentProps) {
  const safeHtml = useMemo(() => sanitizeRichText(html), [html]);

  if (!safeHtml) return null;

  return <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}

export default RichTextContent;
