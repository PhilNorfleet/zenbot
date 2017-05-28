var z = require('zero-fill')
  , n = require('numbro')
module.exports = function container (get, set, clear) {
  return {
    name: 'macd_rsi',
    description: 'Buy when MACD signal trending up, sell when trending down, using RSI',

    getOptions: function () {
      this.option('period', 'period length', String, '1h')
      this.option('min_periods', 'min. number of history periods', Number, 36)
      this.option('ema_periods', 'number of periods for trend EMA', Number, 34)
      this.option('dema_periods', 'number of periods for trend DEMA', Number, 34)
      this.option('macd_periods', 'number of periods for MACD', Number, 26)
      this.option('macd_periods', 'the number of periods for MACD moving average', Number, 9)
      this.option('buy_rate', 'buy if trend EMA rate between neutral_rate and this positive float', Number, 0)
      this.option('sell_rate', 'sell if trend EMA rate between neutral_rate * -1 and this negative float', Number, 0)
      this.option('neutral_rate', 'avoid signals when trend EMA rate is under this absolute value', Number, 'auto')
      this.option('max_buy_duration', 'avoid buy if trend duration over this number', Number, 0)
      this.option('max_sell_duration', 'avoid sell if trend duration over this number', Number, 0)
      this.option('rsi_periods', 'number of periods for oversold RSI', Number, 26)
      this.option('oversold_rsi', 'buy when RSI reaches this value', Number, 20)
      this.option('overbought_rsi', 'sell when RSI reaches this value', Number, 80)
      this.option('auto_rsi', 'use dynamic RSI values', Number, 0)
      this.option('stoch_osc_periods', 'number of periods for Stochastic Oscillator', Number, 14)
      this.option('overbought_stoch_osc', 'overbought value for Stochastic Oscillator', Number, 80)
      this.option('oversold_stoch_osc', 'oversold value for Stochastic Oscillator', Number, 20)
      this.option('auto_stoch_osc', 'use dynamic stochastic oscillator values', Number, 0)
      this.option('cci_periods', 'number of periods for CCI', Number, 20)
      this.option('typ_price_periods', 'number of periods to get typical price', Number, 3)
    },

    calculate: function (s) {
      // initialize indicators
      var indicators = get('indicators.list')
      for (var indicator in indicators) {
        var name = indicators[indicator].name
        get('indicators.' + name)(s, name, s.options[name + '_periods'])
        if (s.lookback[0]) {
          // <indicator>_stddev - standard deviation of indicator over its range
          get('lib.stddev')(s, name + '_stddev', s.options[name + '_periods'], name)
          // <indicator>_rate - % change from last period of each indicator
          s.period[name + '_rate'] = (s.period[name] - s.lookback[0][name]) / s.lookback[0][name] * 100
          // <indicator>_rate_stddev - std dev of % change over half range
          get('lib.stddev')(s, name + '_rate_stddev', Math.floor(s.options[name + '_periods'] / 2), name + '_rate')
        }
      }

    },
    onPeriod: function (s, cb) {
      if (s.options.neutral_rate === 'auto' || s.options.neutral_rate_auto) {
        s.options.neutral_rate_auto = true
        if (typeof s.period.ema_rate_stddev === 'number') {
          s.options.neutral_rate = s.period.ema_rate_stddev
        }
      }
      if (typeof s.period.ema_rate === 'number') {
        if (s.period.ema_rate > s.options.neutral_rate * 1) {
          if (s.trend !== 'up') {
            s.acted_on_trend = false
            s.trend_duration = 0
          }
          s.trend_duration++
          s.trend = 'up'
          s.signal = (!s.options.buy_rate || s.period.ema_rate <= s.options.buy_rate) && (!s.options.max_buy_duration || !s.trend || s.trend_duration <= s.options.max_buy_duration) && !s.acted_on_trend ? 'buy' : null
          s.cancel_down = false
        }
        else if (!s.cancel_down && s.period.ema_rate < (s.options.neutral_rate * -1)) {
          if (s.trend !== 'down') {
            s.acted_on_trend = false
            s.trend_duration = 0
          }
          s.trend_duration++
          s.trend = 'down'
          s.signal = (!s.options.sell_rate || s.period.ema_rate >= s.options.sell_rate) && (!s.options.max_sell_duration || !s.trend || s.trend_duration <= s.options.max_sell_duration) && !s.acted_on_trend ? 'sell' : null
        }
        // else if (typeof s.period.macd === 'number') {
        //   if (s.period.cci < -100 && s.period.rsi <= s.options.oversold_rsi && s.period.stoch_osc <= s.options.oversold_stoch_osc&& (s.lookback[0].macd - s.lookback[0].macd_signal < 0 && s.period.macd - s.period.macd_signal > 0)) {
        //     s.signal = 'buy'
        //   }
        //   else if (s.period.cci > 100 && s.period.rsi >= s.options.overbought_rsi && s.period.stoch_osc >= s.options.overbought_stoch_osc && (s.lookback[0].macd - s.lookback[0].macd_signal > 0 && s.period.macd - s.period.macd_signal < 0)) {
        //     s.signal = 'sell'
        //   }
        // }
      }
      cb()
    },
    // RSI
    // if (typeof s.period.macd === 'number') {
    //     if (s.period.cci < -100 && s.period.rsi <= s.options.oversold_rsi && (s.lookback[0].macd - s.lookback[0].macd_signal < 0 && s.period.macd - s.period.macd_signal > 0)) {
    //       s.signal = 'buy'
    //     }
    //     else if (s.period.cci > 100 && s.period.rsi >= s.options.overbought_rsi && (s.lookback[0].macd - s.lookback[0].macd_signal > 0 && s.period.macd - s.period.macd_signal < 0)) {
    //       s.signal = 'sell'
    //     }
    //   }
    //   cb()
    // },

    // Stochastic Oscillator
    //   if (typeof s.period.macd === 'number') {
    //     if (s.period.cci < -100 && s.period.rsi <= s.options.oversold_rsi && s.period.stoch_osc <= s.options.oversold_stoch_osc && (s.lookback[0].macd - s.lookback[0].macd_signal < 0 && s.period.macd - s.period.macd_signal > 0)) {
    //       s.signal = 'buy'
    //     }
    //     else if (s.period.cci > 100 && s.period.rsi >= s.options.overbought_rsi && s.period.stoch_osc >= s.options.overbought_stoch_osc && (s.lookback[0].macd - s.lookback[0].macd_signal > 0 && s.period.macd - s.period.macd_signal < 0)) {
    //       s.signal = 'sell'
    //     }
    //   }
    //   cb()
    // },
    onReport: function (s) {
      var cols = []
      if (typeof s.period.ema_rate === 'number') {
        var color = 'grey'
        if (s.period.ema_rate > s.options.neutral_rate) {
          color = 'green'
        }
        else if (s.period.ema_rate < (s.options.neutral_rate * -1)) {
          color = 'red'
        }
        cols.push(z(8, n(s.period.ema_rate).format('0.0000'), ' ')[color])
      }
      else {
        cols.push('         ')
      }
      if (s.options.neutral_rate) {
        if (typeof s.period.ema_rate_stddev === 'number') {
          cols.push(z(8, n(s.period.ema_rate_stddev).format('0.0000'), ' ').grey)
        }
        else {
          cols.push('         ')
        }
      }
      return cols
    }
  }
}
