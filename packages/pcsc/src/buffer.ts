/**
 * Buffer layout helpers for the `SCARD_READERSTATE` struct and PC/SC scalar values.
 *
 * The struct offsets vary with the native `DWORD` size used by upstream
 * `pcsc-sys`: 32-bit on Windows and macOS, `unsigned long` elsewhere.
 *
 * ```
 * Offset  0 (8 bytes):   szReader        (pointer to C string)
 * Offset  8 (8 bytes):   pvUserData      (void*, unused = NULL)
 * Offset 16 (DWORD):     dwCurrentState  (DWORD)
 * Offset .. (DWORD):     dwEventState    (DWORD)
 * Offset .. (DWORD):     cbAtr           (DWORD)
 * Offset .. (N bytes):   rgbAtr          (N = 33 on Unix, 36 on Windows)
 * ```
 *
 * @module
 */

import { ATR_BUFFER_SIZE, DWORD_SIZE, POINTER_SIZE } from '@remirth/pcsc-sys';

export const RS_OFFSET_SZREADER = 0;
const RS_OFFSET_PVUSERDATA = POINTER_SIZE;
export const RS_OFFSET_DWCURRENTSTATE = POINTER_SIZE * 2;
export const RS_OFFSET_DWEVENTSTATE = RS_OFFSET_DWCURRENTSTATE + DWORD_SIZE;
export const RS_OFFSET_CBATR = RS_OFFSET_DWEVENTSTATE + DWORD_SIZE;
export const RS_OFFSET_RGBATR = RS_OFFSET_CBATR + DWORD_SIZE;

/** Total size of the `SCARD_READERSTATE` struct in bytes. */
export const READER_STATE_SIZE = RS_OFFSET_RGBATR + ATR_BUFFER_SIZE;

/**
 * Allocate a native-width `DWORD` buffer.
 *
 * Useful for out-parameters passed to PC/SC functions.
 *
 * @param value - The initial value (default 0).
 */
export function allocDword(value = 0): Buffer {
  const buf = Buffer.alloc(DWORD_SIZE);
  writeDword(buf, 0, value);
  return buf;
}

/**
 * Read a native `DWORD` from a buffer at the given byte offset.
 */
export function readDword(buffer: Buffer, offset: number): number {
  if (DWORD_SIZE === 8) {
    return Number(buffer.readBigUInt64LE(offset));
  }
  return buffer.readUInt32LE(offset);
}

/**
 * Write a native `DWORD` value into a buffer at the given byte offset.
 */
export function writeDword(buffer: Buffer, offset: number, value: number): void {
  if (DWORD_SIZE === 8) {
    buffer.writeBigUInt64LE(BigInt(value), offset);
    return;
  }
  buffer.writeUInt32LE(value, offset);
}

function writePointer(buffer: Buffer, offset: number, value: bigint): void {
  if (POINTER_SIZE === 8) {
    buffer.writeBigUInt64LE(value, offset);
    return;
  }
  buffer.writeUInt32LE(Number(value), offset);
}

/**
 * Build an `SCARD_READERSTATE` struct buffer for passing to `SCardGetStatusChange`.
 *
 * @param namePointer - Raw pointer to a NUL-terminated C string (reader name).
 * @param currentState - The currently-known reader state flags.
 */
export function createReaderStateBuffer(namePointer: bigint, currentState: number): Buffer {
  const buf = Buffer.alloc(READER_STATE_SIZE);
  writePointer(buf, RS_OFFSET_SZREADER, namePointer);
  writePointer(buf, RS_OFFSET_PVUSERDATA, 0n);
  writeDword(buf, RS_OFFSET_DWCURRENTSTATE, currentState);
  writeDword(buf, RS_OFFSET_DWEVENTSTATE, 0);
  writeDword(buf, RS_OFFSET_CBATR, 0);
  return buf;
}

/**
 * Read the `dwEventState` field from a populated `SCARD_READERSTATE` buffer.
 */
export function readReaderStateEventState(buf: Buffer): number {
  return readDword(buf, RS_OFFSET_DWEVENTSTATE);
}

/**
 * Read the ATR bytes from a populated `SCARD_READERSTATE` buffer.
 *
 * Returns a subarray of `buf` — no copy is made.
 */
export function readReaderStateAtr(buf: Buffer): Buffer {
  const cbAtr = readDword(buf, RS_OFFSET_CBATR);
  return buf.subarray(RS_OFFSET_RGBATR, RS_OFFSET_RGBATR + cbAtr);
}
