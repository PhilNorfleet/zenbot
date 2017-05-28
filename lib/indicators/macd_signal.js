module.exports = function container (get, set, clear) {
  return function macd_signal (s, key, length, source_key) {
    if (!source_key) source_key = 'close'
    if (s.lookback.length >= length * (9/26)) {
      var prev_macd = s.lookback[0]['macd']
      if (!prev_macd) {
        var sum = 0
        s.lookback.slice(0, length * (9/26)).forEach(function (period) {
          sum += period[source_key]
        })
        prev_macd = sum / (length * (9/26))
      }
      var multiplier = 2 / ((length * (9/26)) + 1)
      s.period[key] = (s.period['macd'] - prev_macd) * multiplier + prev_macd
    }
  }
}
