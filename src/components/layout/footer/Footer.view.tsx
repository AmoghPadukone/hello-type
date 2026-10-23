import { AUTHOR, BRAND } from '@/config/brand';

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

/** Author credit, links and the Apple attribution. */
export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/[0.06] pt-8 pb-28 lg:pb-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm leading-relaxed text-fg-muted text-pretty">
          {BRAND.name} — made with ♥ and far too many Bézier curves by{' '}
          <a
            href={AUTHOR.linkedin}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center font-medium text-fg underline decoration-white/30 underline-offset-2 transition hover:text-accent hover:decoration-accent focus-visible:text-accent"
          >
            {AUTHOR.name}
            <span
              aria-hidden
              className="ml-0 max-w-0 -translate-x-1 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:ml-1.5 group-hover:max-w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            >
              <LinkedInMark />
            </span>
          </a>
        </p>
        <a
          href={AUTHOR.github}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-fg-muted ring-1 ring-white/[0.08] transition hover:text-fg"
        >
          <GitHubMark />
          {AUTHOR.github.replace(/^https:\/\//, '')}
        </a>
      </div>
      <p className="mt-6 border-t border-white/[0.06] pt-5 text-xs leading-relaxed text-fg-subtle text-pretty sm:border-t-0 sm:pt-0">
        In tribute to Susan Kare’s 1984 Macintosh “hello”. Stroke data from{' '}
        <a
          className="underline decoration-white/20 underline-offset-2 hover:text-fg-muted"
          href="https://github.com/JaceThings/SF-Hello"
        >
          SF-Hello
        </a>
        . The “hello” lettering is © Apple Inc. Not affiliated with Apple.
      </p>
    </footer>
  );
}
