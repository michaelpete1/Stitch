type ContextParts = { documents: string[]; course: string };

const ATTACHMENTS_MARKER = 'Attached documents:\n';
const COURSE_MARKER = '\n\nCourse context:\n';

function splitContext(context?: string | null): ContextParts {
  const value = context?.trim();
  if (!value) return { documents: [], course: '' };

  const attachmentsAt = value.indexOf(ATTACHMENTS_MARKER);
  if (attachmentsAt >= 0) {
    const bodyStart = attachmentsAt + ATTACHMENTS_MARKER.length;
    const courseAt = value.indexOf(COURSE_MARKER, bodyStart);
    const documents = value.slice(bodyStart, courseAt >= 0 ? courseAt : undefined).trim();
    const course = courseAt >= 0 ? value.slice(courseAt + COURSE_MARKER.length).trim() : '';
    return { documents: documents ? [documents] : [], course };
  }

  // Preserve documents attached before chat attachments gained a structured context format.
  if (value.startsWith('Attached document:')) return { documents: [value], course: '' };
  return { documents: [], course: value };
}

/** Rebuild the usable file context for every turn in a conversation. */
export function buildConversationContext(currentContext: string | null | undefined, earlierContexts: Array<string | null | undefined>) {
  const current = splitContext(currentContext);
  const earlier = earlierContexts.map(splitContext);
  const documents = [...current.documents, ...earlier.flatMap((parts) => parts.documents)];
  const uniqueDocuments = [...new Set(documents)];
  const course = current.course || earlier.find((parts) => parts.course)?.course || '';
  const sections = [
    uniqueDocuments.length ? `Documents attached in this chat:\n${uniqueDocuments.join('\n\n')}` : '',
    course ? `Course context:\n${course}` : '',
  ].filter(Boolean);

  return sections.join('\n\n').slice(0, 30_000);
}
