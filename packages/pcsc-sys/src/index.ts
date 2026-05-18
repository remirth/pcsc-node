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

import * as constants from './constants.js';
export * from './constants.js';
export * from './types.js';
export * from './bindings.js';

/** All PC/SC constants grouped under a single namespace. */
export const ffi = constants;
