/**
 * `@remirth/pcsc-sys` — Low-level FFI bindings to the PC/SC C API.
 *
 * Re-exports constants, platform-specific types, native library
 * bindings, and the raw PCI descriptor pointers. Most users will
 * use `@remirth/pcsc` instead, which wraps this package with a
 * safe, ergonomic TypeScript API.
 *
 * @module
 */

import * as constants from './constants.ts';
import { SCARD_CTL_CODE, SCARD_PROTOCOL_RAW } from './types.ts';

export * from './constants.ts';
export * from './types.ts';
export * from './bindings.ts';
export type { BackendInfo, BackendMode, BackendName } from './backend.ts';

/** All PC/SC constants grouped under a single namespace. */
export const ffi = {
  ...constants,
  SCARD_PROTOCOL_RAW,
  SCARD_CTL_CODE,
};
