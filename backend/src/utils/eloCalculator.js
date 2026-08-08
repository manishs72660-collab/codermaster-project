// ✅ NEW: K-factor multiplier by difficulty — harder problems move rating more
const DIFFICULTY_MULTIPLIER = {
  easy: 0.75,
  medium: 1,
  hard: 1.5
};

const calculateElo = (winnerRating, loserRating, difficulty = "medium") => {
  const baseK = 32;
  const multiplier = DIFFICULTY_MULTIPLIER[(difficulty || "medium").toLowerCase()] || 1;
  const K = Math.round(baseK * multiplier); // ✅ NEW: weighted K instead of fixed 32

  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 - expectedWinner;

  return {
    newWinnerRating: Math.round(winnerRating + K * (1 - expectedWinner)),
    newLoserRating: Math.round(loserRating + K * (0 - expectedLoser)),
    winnerGain: Math.round(K * (1 - expectedWinner)),
    loserLoss: Math.round(K * (0 - expectedLoser)),
    kFactorUsed: K // ✅ NEW: useful for debugging/UI ("Hard win: 1.5x rating")
  };
};

module.exports = { calculateElo };