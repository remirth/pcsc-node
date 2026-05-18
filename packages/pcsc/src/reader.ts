/**
 * Reader state tracking and reader name iteration.
 *
 * @module
 */

import { getRawPointer } from '@remirth/pcsc-sys';

import { createReaderStateBuffer, readReaderStateAtr, readUint32, writeUint32 } from './buffer.js';
import type { State } from './enums.js';

const RS_OFFSET_DWEVENTSTATE = 20;
const RS_OFFSET_DWCURRENTSTATE = 16;

/**
 * Tracks the current state of a card reader.
 *
 * Wraps the native `SCARD_READERSTATE` struct. Use with
 * {@link Context.getStatusChange} to monitor reader events.
 *
 * @example
 * ```ts
 * const state = new ReaderState('Reader Name 0', State.UNAWARE);
 * ctx.getStatusChange(null, [state]);
 * if (state.eventState & State.CHANGED) {
 *   console.log('Reader state changed!');
 *   state.syncCurrentState();
 * }
 * ```
 */
export class ReaderState {
  private nameBuf: Buffer;
  private inner: Buffer;

  /**
   * Create a `ReaderState` for a card reader.
   *
   * @param name - The reader name (e.g. from {@link Context.listReaders}).
   * @param currentState - The presumed current state (typically `State.UNAWARE`).
   */
  constructor(name: string, currentState: State) {
    this.nameBuf = Buffer.from(name + '\0', 'utf8');
    const namePtr = getRawPointer(this.nameBuf);
    this.inner = createReaderStateBuffer(namePtr, currentState);
  }

  /** The name of the card reader. */
  get name(): string {
    return this.nameBuf.toString('utf8', 0, this.nameBuf.length - 1);
  }

  /** The ATR (Answer To Reset) of the card inserted in the reader. */
  get atr(): Buffer {
    return readReaderStateAtr(this.inner);
  }

  /** The last current state that was set. */
  get currentState(): State {
    return readUint32(this.inner, RS_OFFSET_DWCURRENTSTATE);
  }

  /** The last reported state (set after `getStatusChange` returns). */
  get eventState(): State {
    return readUint32(this.inner, RS_OFFSET_DWEVENTSTATE);
  }

  /**
   * The card event count.
   *
   * Incremented for each card insertion or removal in the reader. Can
   * be used to detect insertions/removals between successive
   * {@link Context.getStatusChange} calls.
   */
  get eventCount(): number {
    return (this.eventState & 0xffff_0000) >>> 16;
  }

  /** Sync the currently-known state to the last reported state. */
  syncCurrentState(): void {
    const eventState = readUint32(this.inner, RS_OFFSET_DWEVENTSTATE);
    writeUint32(this.inner, RS_OFFSET_DWCURRENTSTATE, eventState);
  }

  /** Returns the raw pointer to the underlying struct buffer. */
  getRawPointer(): bigint {
    return getRawPointer(this.inner);
  }
}

/**
 * Iterator over NUL-separated reader name strings.
 *
 * Returned by {@link Context.listReaders}. Does not copy or allocate;
 * iterates directly over the caller-provided buffer.
 *
 * @example
 * ```ts
 * for (const name of readerNames) {
 *   console.log(name);
 * }
 * // Or:
 * const names = readerNames.collect();
 * ```
 */
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

  /**
   * Collect all reader names into a string array.
   */
  collect(): string[] {
    const result: string[] = [];
    for (const name of this) {
      result.push(name);
    }
    return result;
  }
}
