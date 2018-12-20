
import { getLogger } from 'pinus-logger';

const logger = getLogger('game', __filename);

export function Decimal (num: number): number {
  return parseFloat(Number(num).toFixed(2));
}

export function parseObj (value, defaultValue = {}): any {
  if (!value || value === '{}') {
    return defaultValue;
  }

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (e) {
      logger.warn('parseObj error, ', value, e);
      value = defaultValue;
    }
  }

  if (typeof value !== 'object') {
    logger.warn('parseObj warning, value:', value);
    value = defaultValue;
  }

  return value;
}

export function stringifyObj (value, defaultValue = {}): string {
  if (!value) {
    value = defaultValue;
  }

  //如果传过来就字符串，可能被序列化过了，也可能有问题
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
      if (typeof value !== 'object') throw value;
    } catch (e) {
      logger.warn('stringifyObj error, ', value, e);
      value = defaultValue;
    }
  }

  return JSON.stringify(value);
}
