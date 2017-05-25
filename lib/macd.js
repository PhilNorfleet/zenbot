module.exports = function container (get, set, clear) {
  return function macd (s, key, length, source_key) {
    if (!source_key) source_key = 'close'
    if (s.lookback.length >= length) {
      var prev_ema1 = s.lookback[0][key]
      if (!prev_ema1) {
        var sum = 0
        s.lookback.slice(0, length).forEach(function (period) {
          sum += period[source_key]
        })
        prev_ema1 = sum / length
      }
      var multiplier1 = 2 / (length + 1)
      var ema1 = (s.period[source_key] - prev_ema1) * multiplier1 + prev_ema1;
      var ema1 = s.lookback[0][key]
      if (!ema1) {
        var sum = 0
        s.lookback.slice(0, (length / 2 ) ).forEach(function (period) {
          sum += period[source_key]
        })
        ema1 = sum / (length / 2)
      }
      var multiplier2 = 2 / ((length / 2) + 1)
      var ema2 = (s.period[source_key] - ema1) * multiplier2 + ema1;
      var macd = ema2 - ema1
      var multiplier3 = 2 / ((length / 3) + 1)
      s.period[key] = (s.period[source_key] - macd) * multiplier3 + macd
    }
  }
}