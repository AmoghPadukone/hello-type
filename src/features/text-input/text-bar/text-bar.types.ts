export interface TextBarProps {
  value: string;
  /** Characters with no glyph, shown as a warning under the box. */
  skipped: readonly string[];
  onChange: (text: string) => void;
}

export interface TextBarViewProps extends TextBarProps {
  placeholder: string;
}
