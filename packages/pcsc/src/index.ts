/**
 * `@remirth/pcsc` — High-level PC/SC bindings for Node.js.
 *
 * ## Packages
 *
 * - **`@remirth/pcsc-sys`** — Low-level FFI bindings to the PC/SC C API.
 * - **`@remirth/pcsc`** — Safe, ergonomic TypeScript wrapper (this package).
 *
 * ## Quick start
 *
 * ```ts
 * import { Context, Scope, ShareMode, Protocols, MAX_BUFFER_SIZE } from '@remirth/pcsc';
 *
 * const ctx = Context.establish(Scope.User);
 * const readers = ctx.listReadersOwned();
 * const card = ctx.connect(readers[0]!, ShareMode.Shared, Protocols.ANY);
 *
 * const apdu = Buffer.from([0x00, 0xA4, 0x04, 0x00, 0x0A, ...]);
 * const recv = Buffer.alloc(MAX_BUFFER_SIZE);
 * const response = card.transmit(apdu, recv);
 * ```
 *
 * ## Blocking operations
 *
 * The synchronous API (e.g. {@link Context.getStatusChange}) blocks
 * the Node.js event loop. Use {@link ContextAsync} for serialised
 * access, or offload blocking calls to a worker thread for true
 * concurrency.
 *
 * Run with the experimental FFI flag:
 * ```sh
 * node --experimental-ffi your-script.ts
 * ```
 *
 * @module
 */

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

/**
 * Special reader name for detecting card reader insertions and removals.
 *
 * Pass this as the reader name to {@link ReaderState} and use with
 * {@link Context.getStatusChange} to monitor plug-and-play events.
 */
export const PNP_NOTIFICATION = '\\\\?PnP?\\Notification' as const;
