// Logo.jsx
// Shared brand mark for both auth pages (and anywhere else it's needed).
// Uses the real logo image as the mark, paired with a two-tone wordmark:
// upright "Code" + italic serif "Master" — structure meeting craft.
// An optional `tagline` renders a small tracked line beneath the wordmark,
// for placements (like the auth panel) that want the brand given real room.

import mylogo from "../assets/mylogo.png";

const SIZES = {
  sm: { mark: 'h-9 w-9', gap: 'gap-2.5', code: 'text-[21px]', master: 'text-[23px]' },
  lg: { mark: 'h-12 w-12', gap: 'gap-3', code: 'text-[26px]', master: 'text-[28px]' },
  xl: { mark: 'h-14 w-14', gap: 'gap-3.5', code: 'text-[32px]', master: 'text-[35px]' },
};

function Logo({ size = 'lg', className = '', tagline }) {
  const s = SIZES[size] ?? SIZES.lg;

  return (
    <div className={className}>
      <div className={`flex items-center ${s.gap}`}>
        <img
          src={mylogo}
          alt="CodeMaster logo"
          className={`shrink-0 object-contain ${s.mark}`}
        />

        <div className="flex items-baseline gap-[3px]">
          <span className={`font-display font-800 leading-none tracking-tight text-white ${s.code}`}>
            Code
          </span>
          <span className={`font-script italic leading-none text-orange-400 ${s.master}`}>
            Master
          </span>
        </div>
      </div>

      {tagline && (
        <p className="font-body mt-2.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white/25">
          {tagline}
        </p>
      )}
    </div>
  );
}

export default Logo;