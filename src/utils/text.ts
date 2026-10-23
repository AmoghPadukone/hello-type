import { DEFAULT_NAME } from '@/config/constants';

/** Lowercase, dash-separated file name from the text, e.g. "Hello there!" → "hello-there". */
export function slug(text: string, fallback = DEFAULT_NAME) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || fallback
  );
}
