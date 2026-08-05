const calculateElo = (winnerRating, loserRating) => {
  const K = 32;
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 - expectedWinner;

  return {
    newWinnerRating: Math.round(winnerRating + K * (1 - expectedWinner)),
    newLoserRating: Math.round(loserRating + K * (0 - expectedLoser)),
    winnerGain: Math.round(K * (1 - expectedWinner)),
    loserLoss: Math.round(K * (0 - expectedLoser))
  };
};

module.exports = { calculateElo };