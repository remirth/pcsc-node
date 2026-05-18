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

export const READER_STATE_SIZE = RS_OFFSET_RGBATR + ATR_SIZE;

export function allocUint32(value: number = 0): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value, 0);
  return buf;
}

export function readUint32(buffer: Buffer, offset: number): number {
  return buffer.readUInt32LE(offset);
}

export function readInt32(buffer: Buffer, offset: number): number {
  return buffer.readInt32LE(offset);
}

export function writeUint32(buffer: Buffer, offset: number, value: number): void {
  buffer.writeUInt32LE(value, offset);
}

export function writeUint64(buffer: Buffer, offset: number, value: bigint): void {
  buffer.writeBigUInt64LE(value, offset);
}

export function createReaderStateBuffer(namePointer: bigint, currentState: number): Buffer {
  const buf = Buffer.alloc(READER_STATE_SIZE);
  writeUint64(buf, RS_OFFSET_SZREADER, namePointer);
  writeUint64(buf, RS_OFFSET_PVUSERDATA, 0n);
  writeUint32(buf, RS_OFFSET_DWCURRENTSTATE, currentState);
  writeUint32(buf, RS_OFFSET_DWEVENTSTATE, 0);
  writeUint32(buf, RS_OFFSET_CBATR, 0);
  return buf;
}

export function readReaderStateEventState(buf: Buffer): number {
  return readUint32(buf, RS_OFFSET_DWEVENTSTATE);
}

export function readReaderStateAtr(buf: Buffer): Buffer {
  const cbAtr = readUint32(buf, RS_OFFSET_CBATR);
  return buf.subarray(RS_OFFSET_RGBATR, RS_OFFSET_RGBATR + cbAtr);
}
