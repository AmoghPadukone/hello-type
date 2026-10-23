import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Folder boundaries (see docs/architecture.md). Each entry lists what a part of src/ may not import.
const UI_LAYERS = [
  '@/app',
  '@/app/*',
  '@/features/*',
  '@/components/*',
  '@/hooks/*',
  '@/settings',
  '@/settings/*',
];
const restrict = (files, patterns) => ({
  files,
  rules: { '@typescript-eslint/no-restricted-imports': ['error', { patterns }] },
});
const notFrom = (groups, message) => ({ group: groups, message });
// three.js is code-split: outside src/viewer the viewer may only be imported as a type
// (features/print/hooks/use-viewer.ts loads it with a dynamic import).
const viewerTypeOnly = {
  group: ['@/viewer/*'],
  allowTypeImports: true,
  message: 'Load the viewer with a dynamic import (see useViewer) so three.js stays code-split.',
};

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2023, globals: { ...globals.browser, ...globals.worker } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  restrict(
    ['src/core/**'],
    [
      notFrom(
        ['react', 'react-dom', 'react/*', 'three', 'three/*'],
        'core/ is framework-free: it runs in the worker and in Node tests.',
      ),
      notFrom(
        [...UI_LAYERS, '@/utils', '@/utils/*', '@/viewer/*'],
        'core/ may only import core/ and config/.',
      ),
    ],
  ),
  restrict(
    ['src/viewer/**'],
    [notFrom([...UI_LAYERS, '@/utils', '@/utils/*', 'react'], 'viewer/ depends on core/ only.')],
  ),
  restrict(
    ['src/components/**', 'src/hooks/**', 'src/settings/**', 'src/utils/**', 'src/config/**'],
    [
      notFrom(
        ['@/app', '@/app/*', '@/features/*'],
        'Shared code must not depend on the app shell or a feature.',
      ),
      viewerTypeOnly,
    ],
  ),
  restrict(
    ['src/features/graphic/**'],
    [
      notFrom(
        ['@/app', '@/app/*', '@/features/print/*', '@/features/text-input/*'],
        'Features must not import each other.',
      ),
      viewerTypeOnly,
    ],
  ),
  restrict(
    ['src/features/print/**'],
    [
      notFrom(
        ['@/app', '@/app/*', '@/features/graphic/*', '@/features/text-input/*'],
        'Features must not import each other.',
      ),
      viewerTypeOnly,
    ],
  ),
  restrict(
    ['src/features/text-input/**'],
    [
      notFrom(
        ['@/app', '@/app/*', '@/features/graphic/*', '@/features/print/*'],
        'Features must not import each other.',
      ),
      viewerTypeOnly,
    ],
  ),
  restrict(['src/app/**', 'src/main.tsx'], [viewerTypeOnly]),
);
