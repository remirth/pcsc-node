/**
 * Platform-specific type definitions for the PC/SC FFI layer.
 *
 * Mirrors `pcsc-sys`:
 * - Windows: `SCARDCONTEXT` / `SCARDHANDLE` are `usize`
 * - macOS: `DWORD` / `LONG` / `ULONG` are fixed 32-bit values
 * - Other platforms: `DWORD` / `LONG` / `ULONG` follow C `unsigned long` / `long`
 *
 * @module
 */

import { arch, platform } from 'node:os';

/** Whether the current platform is Windows. */
export const isWindows = platform() === 'win32';

/** Whether the current platform is macOS. */
export const isMacOS = platform() === 'darwin';

const THIRTY_TWO_BIT_ARCHES = new Set(['arm', 'ia32', 'mips', 'mipsel', 'ppc']);

/** Size of a native pointer on the current architecture. */
export const POINTER_SIZE = THIRTY_TWO_BIT_ARCHES.has(arch()) ? 4 : 8;

/** JavaScript representation of a PC/SC `DWORD`. */
export type DWORD = number;

/** JavaScript representation of a PC/SC `LONG` return code. */
export type LONG = number;

/** JavaScript representation of a PC/SC `ULONG`. */
export type ULONG = number;

/** Primitive FFI type names shared by the supported backends. */
export type FfiPrimitiveType = 'i32' | 'u32' | 'i64' | 'u64' | 'pointer' | 'string';

/** Opaque PC/SC context handle. */
export type RawContext = number | bigint;

/** Opaque PC/SC card handle. */
export type RawCard = number | bigint;

/** The {@link https://nodejs.org/api/ffi.html | node:ffi} type string used for `DWORD`. */
export const DWORD_TYPE: FfiPrimitiveType = isWindows || isMacOS ? 'u32' : 'u64';

/** The {@link https://nodejs.org/api/ffi.html | node:ffi} type string used for `LONG`. */
export const LONG_TYPE: FfiPrimitiveType = isWindows || isMacOS ? 'i32' : 'i64';

/** The {@link https://nodejs.org/api/ffi.html | node:ffi} type string used for `ULONG`. */
export const ULONG_TYPE: FfiPrimitiveType = isWindows || isMacOS ? 'u32' : 'u64';

/** Size of a native `DWORD`. */
export const DWORD_SIZE = isWindows || isMacOS ? 4 : 8;

/** Size of a native `LONG`. */
export const LONG_SIZE = isWindows || isMacOS ? 4 : 8;

/** Size of a native `ULONG`. */
export const ULONG_SIZE = DWORD_SIZE;

/** Size of a native `SCARDCONTEXT`. */
export const SCARDCONTEXT_SIZE = isWindows ? POINTER_SIZE : LONG_SIZE;

/** Size of a native `SCARDHANDLE`. */
export const SCARDHANDLE_SIZE = isWindows ? POINTER_SIZE : LONG_SIZE;

/** The {@link https://nodejs.org/api/ffi.html | node:ffi} type string used for `SCARDCONTEXT` parameters. */
export const SCARDCONTEXT_TYPE: FfiPrimitiveType = isWindows ? 'pointer' : LONG_TYPE;

/** The {@link https://nodejs.org/api/ffi.html | node:ffi} type string used for `SCARDHANDLE` parameters. */
export const SCARDHANDLE_TYPE: FfiPrimitiveType = isWindows ? 'pointer' : LONG_TYPE;

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

/** Alias for the upstream `SCARD_CTL_CODE` helper. */
export const SCARD_CTL_CODE = scardCtlCode;

/** Decode a native `SCARDCONTEXT` from an out-parameter buffer. */
export function readRawContext(buffer: Buffer, offset = 0): RawContext {
  if (isWindows) {
    return POINTER_SIZE === 8 ? buffer.readBigUInt64LE(offset) : buffer.readUInt32LE(offset);
  }
  return LONG_SIZE === 8 ? buffer.readBigInt64LE(offset) : buffer.readInt32LE(offset);
}

/** Decode a native `SCARDHANDLE` from an out-parameter buffer. */
export function readRawCard(buffer: Buffer, offset = 0): RawCard {
  if (isWindows) {
    return POINTER_SIZE === 8 ? buffer.readBigUInt64LE(offset) : buffer.readUInt32LE(offset);
  }
  return LONG_SIZE === 8 ? buffer.readBigInt64LE(offset) : buffer.readInt32LE(offset);
}
