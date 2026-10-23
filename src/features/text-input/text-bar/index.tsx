import { useCyclingPlaceholder } from '../hooks/use-cycling-placeholder';
import type { TextBarProps } from './text-bar.types';
import { TextBarView } from './TextBar.view';

/** The text box every workspace starts from. */
export function TextBar(props: TextBarProps) {
  const placeholder = useCyclingPlaceholder(props.value.length === 0);
  return <TextBarView {...props} placeholder={placeholder} />;
}
