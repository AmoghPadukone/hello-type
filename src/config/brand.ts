/** Product naming and credits, in one place so the UI, exports and metadata agree. */
export const BRAND = {
  name: 'Hellotype',
  tagline: 'Your words, in the script that said hello.',
  description:
    'Type anything and watch it write itself — then download a crisp SVG or a print-ready 3D model.',
} as const;

export const REPO_URL = 'https://github.com/AmoghPadukone/hello-font';

export const CREDITS = [
  {
    who: 'Susan Kare',
    what: 'Drew the original cursive “hello” for the Macintosh in 1984 — the lettering this whole project is built on.',
    href: 'https://kare.com',
  },
  {
    who: 'SF-Hello',
    what: 'Gigi (@g-cqd) and Jace (@JaceThings) extracted the stroke data used here.',
    href: 'https://github.com/JaceThings/SF-Hello',
  },
  {
    who: 'Source code',
    what: 'Hellotype is open source. Browse the code, report a bug or send a pull request.',
    href: REPO_URL,
  },
  {
    who: 'Apple',
    what: 'The “hello” lettering and stroke data are © Apple Inc. Hellotype is not affiliated with Apple.',
  },
] as const;

export const AUTHOR = {
  name: 'Amogh Padukone',
  github: 'https://github.com/AmoghPadukone',
  linkedin: 'https://www.linkedin.com/in/amogh-padukone/',
} as const;

/**
 * Per-workspace copy: each audience sees a headline written for them. `script` is drawn
 * inline in Hellotype's own lettering, between `before` and `after`.
 */
export const MODE_COPY = {
  graphic: {
    tab: 'Graphic',
    formats: 'SVG · PNG',
    before: 'Your words, as crisp vector',
    script: 'art',
    after: '.',
    description:
      'Your words in the cursive that first said hello on the Mac — as a crisp SVG, a self-drawing animation, or a PNG.',
  },
  print: {
    tab: '3D print',
    formats: '3MF · STL',
    before: 'Turn your',
    script: 'words',
    after: 'into 3D models.',
    description:
      'A smooth, solid tube that stands on its own. Export a watertight 3MF or STL, ready for your slicer in seconds.',
  },
} as const;

/** No i or j on purpose: their floating dots are the one thing the plain preview can't show off. */
export const EXAMPLES = [
  'hello',
  'thank you',
  'merhaba',
  'good luck',
  'stay golden',
  'much love',
  'sweet dreams',
  'welcome home',
  'hola amor',
  'namaste',
  'be bold',
  'you got this',
  'dream on',
  'happy days',
  'stay cool',
  'good morning world',
] as const;
