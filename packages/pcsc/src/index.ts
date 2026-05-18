export {
  MAX_ATR_SIZE,
  MAX_BUFFER_SIZE,
  MAX_BUFFER_SIZE_EXTENDED,
  SCARD_S_SUCCESS,
  SCARD_E_NO_SMARTCARD,
  SCARD_E_CANCELLED,
  SCARD_E_TIMEOUT,
  SCARD_E_NO_READERS_AVAILABLE,
  SCARD_E_INSUFFICIENT_BUFFER,
  scardCtlCode as ctlCode,
} from '@remirth/pcsc-sys';
export * from './error.js';
export * from './enums.js';
export * from './context.js';
export * from './card.js';
export * from './transaction.js';
export * from './reader.js';
export * from './async.js';
export * from './buffer.js';

export const PNP_NOTIFICATION = '\\\\?PnP?\\Notification' as const;
