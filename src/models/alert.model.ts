interface RawPayload {
  event: string;
  stop_loss: string;
  symbol: string;
  interval: string;
  bar_time: string;
  close: string;
  open: string;
  high: string;
  low: string;
}

export enum AlertEvent {
  OpenShort = 'open_short',
  CloseShort = 'close_short',
  OpenLong = 'open_long',
  CloseLong = 'close_long',
}

export class AlertModel {
  event: AlertEvent;
  stopLoss: number;
  symbol: string;
  interval: number;
  barTime: number;
  close: number;
  open: number;
  high: number;
  low: number;

  constructor(json: string, symbol: string, timeframe: number) {
    const rawPayload = JSON.parse(json) as RawPayload;

    if (rawPayload.symbol !== symbol) {
      throw `Unexpected symbol: ${rawPayload.symbol}. Expecting: ${symbol}`;
    }
    if (rawPayload.interval !== `${timeframe}`) {
      throw `Unexpected timeframe: ${rawPayload.interval}. Expecting: ${timeframe}`;
    }
    if (!Object.values(AlertEvent).includes(rawPayload.event as AlertEvent)) {
      throw `Unexpected event: ${rawPayload.event}. Expecting: ${Object.values(AlertEvent).join(', ')}`;
    }

    this.event = rawPayload.event as AlertEvent;
    this.stopLoss = parseFloat(rawPayload.stop_loss) || 0;
    this.symbol = rawPayload.symbol;
    this.interval = parseFloat(rawPayload.interval);
    this.barTime = parseInt(rawPayload.bar_time);
    this.close = parseFloat(rawPayload.close);
    this.open = parseFloat(rawPayload.open);
    this.high = parseFloat(rawPayload.high);
    this.low = parseFloat(rawPayload.low);

    if (this.barTime === Number.NaN) {
      throw `Invalid bar time: ${rawPayload.bar_time}. Expecting an integer`;
    }

    ['close', 'open', 'high', 'low'].forEach((barData: keyof AlertModel) => {
      if (this[barData] === Number.NaN) {
        throw `Invalid bar ${barData}: ${rawPayload[barData]}. Expecting a float`;
      }
    });
  }
}
