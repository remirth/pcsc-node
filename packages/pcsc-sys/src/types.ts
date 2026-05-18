/**
 * Platform-specific type definitions for the PC/SC FFI layer.
 *
 * On Windows, `SCARDCONTEXT` and `SCARDHANDLE` are pointer-sized
 * (`ULONG_PTR`). On Linux and macOS they are `LONG` (32-bit `int32_t`).
 *
 * @module
 */

import { platform } from 'node:os';

/** Whether the current platform is Windows. */
export const isWindows = platform() === 'win32';

/** 32-bit unsigned integer (matches C `DWORD` / `uint32_t`). */
export type DWORD = number;

/** 32-bit signed integer (matches C `LONG` / `int32_t`). */
export type LONG = number;

/**
 * Opaque PC/SC context handle.
 *
 * On Windows this is pointer-sized (`bigint`); on other platforms it is
 * a 32-bit signed integer (`number`).
 */
export type RawContext = number | bigint;

/**
 * Opaque PC/SC card handle.
 *
 * On Windows this is pointer-sized (`bigint`); on other platforms it is
 * a 32-bit signed integer (`number`).
 */
export type RawCard = number | bigint;

/** The {@link https://nodejs.org/api/ffi.html | node:ffi} type string used for `SCARDCONTEXT` parameters. */
export const SCARDCONTEXT_TYPE = isWindows ? ('pointer' as const) : ('i32' as const);

/** The {@link https://nodejs.org/api/ffi.html | node:ffi} type string used for `SCARDHANDLE` parameters. */
export const SCARDHANDLE_TYPE = isWindows ? ('pointer' as const) : ('i32' as const);

/**
 * `SCARD_PROTOCOL_RAW` — platform-dependent value.
 * `0x0001_0000` on Windows, `0x0000_0004` everywhere else.
 */
export const SCARD_PROTOCOL_RAW: number = isWindows ? 0x0001_0000 : 0x0000_0004;

/**
 * Transform a control code for the current platform.
 *
 * Wraps the `SCARD_CTL_CODE` macro. Control codes passed to
 * {@link Card.control} are usually defined as inputs to this function.
 *
 * @param code - The base control code value.
 */
export function scardCtlCode(code: DWORD): DWORD {
  if (isWindows) {
    return 0x0031_0000 | (code << 2);
  }
  return 0x4200_0000 + code;
}
