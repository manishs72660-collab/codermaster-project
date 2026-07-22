// Static batch config. Add/remove batches here — nothing else needs to change.
// `image` should point at a bundled asset, e.g. import batch1 from '../assets/batches/batch1.png'
// then reference it here, OR a path under /public if you'd rather not import it.
//
// Each batch has a `requirement` describing what unlocks it:
//   { type: 'activeDays',     value: 10,  label: '10 days on CodeMaster' }
//   { type: 'problemsSolved', value: 100, label: '100 problems on CodeMaster' }
// A batch with `requirement: null` is a placeholder — always shown locked,
// with a "coming soon" label, until you fill in its requirement.

import fist from '../assets/fist.jpg';
import batch1 from '../assets/batch1.jpg';
import batch2 from '../assets/batch2.jpg';
import batch3 from '../assets/batch3.jpg';
// import batch4 from '../assets/batch4.jpg'; // add once you have the image

export const batches = [
  {
    id: 'batch-0',
    name: 'First Blood',
    image: fist,
    requirement: { type: 'problemsSolved', value: 1, label: '1 problem on CodeMaster' },
  },
  {
    id: 'batch-1',
    name: 'Foundations',
    image: batch1,
    requirement: { type: 'activeDays', value: 10, label: '10 days on CodeMaster' },
  },
  {
    id: 'batch-2',
    name: 'Consistency',
    image: batch2,
    requirement: { type: 'activeDays', value: 20, label: '20 days on CodeMaster' },
  },
  {
    id: 'batch-3',
    name: 'Problem Solver',
    image: batch3,
    requirement: { type: 'problemsSolved', value: 100, label: '100 problems on CodeMaster' },
  },
];

// Derives raw progress numbers from data you already fetch for the profile page.
const getUserMetrics = ({ heatmap, stats }) => ({
  activeDays: Object.values(heatmap || {}).filter((count) => count > 0).length,
  problemsSolved: stats?.total ?? 0,
});

// Returns batches annotated with unlock state, progress, and which one is "next up".
// Pass in the same `heatmap` and `stats` the profile page already loads.
export const getBatchesForUser = ({ heatmap, stats }) => {
  const metrics = getUserMetrics({ heatmap, stats });

  const withProgress = batches.map((batch) => {
    if (!batch.requirement) {
      return { ...batch, isUnlocked: false, isNext: false, progress: 0, isPlaceholder: true };
    }
    const { type, value } = batch.requirement;
    const current = metrics[type] ?? 0;
    return {
      ...batch,
      isUnlocked: current >= value,
      progress: Math.min(100, Math.round((current / value) * 100)),
      current,
      isPlaceholder: false,
    };
  });

  // first locked, non-placeholder batch in list order is "next up"
  const nextBatchId = withProgress.find((b) => !b.isUnlocked && !b.isPlaceholder)?.id;

  return withProgress.map((b) => ({ ...b, isNext: b.id === nextBatchId }));
};