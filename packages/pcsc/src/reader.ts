import { getRawPointer } from '@remirth/pcsc-sys';

import { State } from './enums.js';
import {
  createReaderStateBuffer,
  readReaderStateAtr,
  readUint32,
  writeUint32,
} from './buffer.js';

const RS_OFFSET_DWEVENTSTATE = 20;
const RS_OFFSET_DWCURRENTSTATE = 16;

export class ReaderState {
  private nameBuf: Buffer;
  private inner: Buffer;

  constructor(name: string, currentState: State) {
    this.nameBuf = Buffer.from(name + '\0', 'utf8');
    const namePtr = getRawPointer(this.nameBuf);
    this.inner = createReaderStateBuffer(namePtr, currentState);
  }

  get name(): string {
    return this.nameBuf.toString('utf8', 0, this.nameBuf.length - 1);
  }

  get atr(): Buffer {
    return readReaderStateAtr(this.inner);
  }

  get currentState(): State {
    return readUint32(this.inner, RS_OFFSET_DWCURRENTSTATE);
  }

  get eventState(): State {
    return readUint32(this.inner, RS_OFFSET_DWEVENTSTATE);
  }

  get eventCount(): number {
    return (this.eventState & 0xFFFF_0000) >>> 16;
  }

  syncCurrentState(): void {
    const eventState = readUint32(this.inner, RS_OFFSET_DWEVENTSTATE);
    writeUint32(this.inner, RS_OFFSET_DWCURRENTSTATE, eventState);
  }

  getRawPointer(): bigint {
    return getRawPointer(this.inner);
  }
}

export class ReaderNames {
  private buf: Buffer;
  private pos: number;

  constructor(buf: Buffer) {
    this.buf = buf;
    this.pos = 0;
  }

  [Symbol.iterator](): Iterator<string> {
    return this;
  }

  next(): IteratorResult<string> {
    if (this.pos >= this.buf.length) {
      return { done: true, value: undefined };
    }

    const start = this.pos;
    let end = this.buf.indexOf(0, start);
    if (end === -1 || end === start) {
      this.pos = this.buf.length;
      return { done: true, value: undefined };
    }

    this.pos = end + 1;
    return { done: false, value: this.buf.toString('utf8', start, end) };
  }

  collect(): string[] {
    const result: string[] = [];
    for (const name of this) {
      result.push(name);
    }
    return result;
  }
}
