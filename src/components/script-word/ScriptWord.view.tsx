import { cn } from '@/utils/cn';
import type { ScriptWordViewProps } from './script-word.types';

export function ScriptWordView({ hostRef, text, className, svg, height, drop }: ScriptWordViewProps) {
  return (
    <span
      ref={hostRef}
      role="img"
      aria-label={text}
      className={cn('inline-block [&_svg]:h-full [&_svg]:w-auto', className)}
      style={{ height: `${height}em`, verticalAlign: `-${drop}em` }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
