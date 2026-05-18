/**
 * Buffer layout helpers for the `SCARD_READERSTATE` struct and DWORD values.
 *
 * The struct offsets are based on the 64-bit C ABI (LP64 model):
 *
 * ```
 * Offset  0 (8 bytes):   szReader        (pointer to C string)
 * Offset  8 (8 bytes):   pvUserData      (void*, unused = NULL)
 * Offset 16 (4 bytes):   dwCurrentState  (DWORD)
 * Offset 20 (4 bytes):   dwEventState    (DWORD)
 * Offset 24 (4 bytes):   cbAtr           (DWORD)
 * Offset 28 (N bytes):   rgbAtr          (N = 33 on Unix, 36 on Windows)
 * ```
 *
 * Total struct size is 64 bytes on 64-bit platforms (padded to 8-byte alignment).
 *
 * @module
 */

import { platform } from 'node:os';
import { MAX_ATR_SIZE } from '@remirth/pcsc-sys';

const IS_WINDOWS = platform() === 'win32';
const ATR_SIZE = IS_WINDOWS ? 36 : MAX_ATR_SIZE;
const PTR_SIZE = 8;

const RS_OFFSET_SZREADER = 0;
const RS_OFFSET_PVUSERDATA = PTR_SIZE;
const RS_OFFSET_DWCURRENTSTATE = PTR_SIZE * 2;
const RS_OFFSET_DWEVENTSTATE = RS_OFFSET_DWCURRENTSTATE + 4;
const RS_OFFSET_CBATR = RS_OFFSET_DWEVENTSTATE + 4;
const RS_OFFSET_RGBATR = RS_OFFSET_CBATR + 4;

/** Total size of the `SCARD_READERSTATE` struct in bytes (64 on 64-bit). */
export const READER_STATE_SIZE = RS_OFFSET_RGBATR + ATR_SIZE;

/**
 * Allocate a 4-byte buffer with a little-endian `uint32` value.
 *
 * Useful for out-parameters passed to PC/SC functions.
 *
 * @param value - The initial value (default 0).
 */
export function allocUint32(value: number = 0): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value, 0);
  return buf;
}

/**
 * Read a little-endian `uint32` from a buffer at the given byte offset.
 */
export function readUint32(buffer: Buffer, offset: number): number {
  return buffer.readUInt32LE(offset);
}

/**
 * Read a little-endian `int32` from a buffer at the given byte offset.
 */
export function readInt32(buffer: Buffer, offset: number): number {
  return buffer.readInt32LE(offset);
}

/**
 * Write a little-endian `uint32` value into a buffer at the given byte offset.
 */
export function writeUint32(buffer: Buffer, offset: number, value: number): void {
  buffer.writeUInt32LE(value, offset);
}

/**
 * Write a little-endian `uint64` (bigint) value into a buffer at the given byte offset.
 */
export function writeUint64(buffer: Buffer, offset: number, value: bigint): void {
  buffer.writeBigUInt64LE(value, offset);
}

/**
 * Build an `SCARD_READERSTATE` struct buffer for passing to `SCardGetStatusChange`.
 *
 * @param namePointer - Raw pointer to a NUL-terminated C string (reader name).
 * @param currentState - The currently-known reader state flags.
 */
export function createReaderStateBuffer(namePointer: bigint, currentState: number): Buffer {
  const buf = Buffer.alloc(READER_STATE_SIZE);
  writeUint64(buf, RS_OFFSET_SZREADER, namePointer);
  writeUint64(buf, RS_OFFSET_PVUSERDATA, 0n);
  writeUint32(buf, RS_OFFSET_DWCURRENTSTATE, currentState);
  writeUint32(buf, RS_OFFSET_DWEVENTSTATE, 0);
  writeUint32(buf, RS_OFFSET_CBATR, 0);
  return buf;
}

/**
 * Read the `dwEventState` field from a populated `SCARD_READERSTATE` buffer.
 */
export function readReaderStateEventState(buf: Buffer): number {
  return readUint32(buf, RS_OFFSET_DWEVENTSTATE);
}

/**
 * Read the ATR bytes from a populated `SCARD_READERSTATE` buffer.
 *
 * Returns a subarray of `buf` — no copy is made.
 */
export function readReaderStateAtr(buf: Buffer): Buffer {
  const cbAtr = readUint32(buf, RS_OFFSET_CBATR);
  return buf.subarray(RS_OFFSET_RGBATR, RS_OFFSET_RGBATR + cbAtr);
}
