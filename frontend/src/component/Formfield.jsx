import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Floating-label input with an animated accent underline.
 * Works with react-hook-form's register() via forwardRef + spread props.
 */
const FormField = forwardRef(function FormField(
  { label, error, type = 'text', hint, rightSlot, className, ...rest },
  ref
) {
  return (
    <div className={className}>
      <div className="relative">
        <input
          ref={ref}
          type={type}
          placeholder=" "
          className={cn(
            'peer w-full rounded-lg border bg-black/20 px-3.5 pt-5 pb-2 font-body text-sm font-medium text-white/90 outline-none transition-colors duration-200',
            rightSlot && 'pr-10',
            error
              ? 'border-rose-500/40 bg-rose-500/[0.04] focus:border-rose-500/60'
              : 'border-white/[0.08] focus:border-orange-500/50 focus:bg-black/30'
          )}
          {...rest}
        />
        <label
          className={cn(
            'pointer-events-none absolute left-3.5 top-4 font-code text-[13px] transition-all duration-200',
            'peer-focus:top-2 peer-focus:text-[10px] peer-focus:tracking-wide',
            'peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:tracking-wide',
            error ? 'text-rose-300/70 peer-focus:text-rose-300' : 'text-white/25 peer-focus:text-orange-400/90 peer-[:not(:placeholder-shown)]:text-white/40'
          )}
        >
          {label}
        </label>
        <span
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-300 peer-focus:scale-x-100',
            error ? 'bg-rose-400' : 'bg-orange-400'
          )}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>

      {error ? (
        <span className="mt-1.5 flex items-center gap-1 font-code text-[11px] text-rose-400">
          <AlertCircle className="h-3 w-3" /> {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block font-code text-[11px] text-white/20">{hint}</span>
      ) : null}
    </div>
  );
});

export default FormField;