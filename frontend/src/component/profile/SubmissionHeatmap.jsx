import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Activity, GitBranch } from 'lucide-react';

const SubmissionHeatmap = ({ heatmap }) => {
  const values = Object.entries(heatmap || {}).map(([date, count]) => ({ date, count }));
  const today = new Date();

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <div className="ml-1.5 flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-white/50">
          <Activity className="h-3 w-3 text-orange-400" />
          activity.log
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-white/15">
          <GitBranch className="h-3 w-3" />
          <span className="font-mono text-[10px]">{today.getFullYear()}</span>
        </div>
      </div>

      <div className="p-5">
        <div className="submission-heatmap">
          <CalendarHeatmap
            startDate={new Date(today.getFullYear(), 0, 1)}
            endDate={new Date(today.getFullYear(), 11, 31)}
            values={values}
            classForValue={(v) => {
              if (!v || !v.count) return 'color-empty';
              if (v.count >= 5) return 'color-scale-4';
              if (v.count >= 3) return 'color-scale-3';
              if (v.count >= 1) return 'color-scale-2';
              return 'color-scale-1';
            }}
          />
        </div>

        <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[10px] text-white/25">
          less
          <span className="h-2.5 w-2.5 rounded-sm bg-white/[0.05]" />
          <span className="h-2.5 w-2.5 rounded-sm bg-orange-500/25" />
          <span className="h-2.5 w-2.5 rounded-sm bg-orange-500/55" />
          <span className="h-2.5 w-2.5 rounded-sm bg-orange-500/90" />
          more
        </div>
      </div>

      {/* overrides library defaults to match the dark, orange-accented palette */}
      <style>{`
        .submission-heatmap .react-calendar-heatmap {
          font-family: inherit;
        }
        .submission-heatmap .react-calendar-heatmap text {
          fill: rgba(255, 255, 255, 0.25);
          font-size: 9px;
          font-family: ui-monospace, monospace;
        }
        .submission-heatmap .react-calendar-heatmap .color-empty {
          fill: rgba(255, 255, 255, 0.05);
        }
        .submission-heatmap .react-calendar-heatmap .color-scale-1 {
          fill: rgba(249, 115, 22, 0.22);
        }
        .submission-heatmap .react-calendar-heatmap .color-scale-2 {
          fill: rgba(249, 115, 22, 0.42);
        }
        .submission-heatmap .react-calendar-heatmap .color-scale-3 {
          fill: rgba(249, 115, 22, 0.68);
        }
        .submission-heatmap .react-calendar-heatmap .color-scale-4 {
          fill: rgba(249, 115, 22, 0.95);
        }
        .submission-heatmap .react-calendar-heatmap rect {
          rx: 2px;
        }
      `}</style>
    </div>
  );
};

export default SubmissionHeatmap;