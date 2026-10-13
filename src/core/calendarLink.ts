// Pulls the calendar id out of whatever someone pastes: a full share link, a
// link from a different environment (localhost, a deploy preview), or the bare
// id on its own.

const ID_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

export function parseCalendarLink(input: string): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  if (ID_PATTERN.test(trimmed)) return trimmed;

  // `new URL` needs a scheme; people routinely paste bare hostnames.
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let path: string;
  try {
    path = new URL(candidate).pathname;
  } catch {
    return null;
  }

  const match = /\/c\/([^/?#]+)/.exec(path);
  if (!match) return null;

  const id = decodeURIComponent(match[1]);
  return ID_PATTERN.test(id) ? id : null;
}
