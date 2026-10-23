import { cn } from '@/utils/cn';
import type { ButtonProps, ButtonVariant } from './button.types';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-[0_1px_0_rgba(255,255,255,0.15)_inset]',
  secondary: 'bg-white/[0.06] text-fg ring-1 ring-inset ring-white/10 hover:bg-white/10',
  ghost: 'text-fg-muted hover:text-fg hover:bg-white/[0.06]',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:pointer-events-none disabled:opacity-40',
        size === 'md' ? 'h-9 px-4 text-[13px]' : 'h-7 px-3 text-xs',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
