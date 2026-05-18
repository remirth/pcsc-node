/**
 * Async wrapper classes for the PC/SC API.
 *
 * {@link ContextAsync} and {@link CardAsync} provide Promise-based
 * wrappers around the synchronous {@link Context} and {@link Card}
 * classes. A simple internal mutex ensures that operations on a single
 * context are serialised — only one call runs at a time.
 *
 * **Important:** Truly blocking operations (like
 * {@link ContextAsync.getStatusChange}) will still block the Node.js
 * event loop in the async variant. For non-blocking behaviour, offload
 * these calls to a worker thread.
 *
 * @module
 */

import type { Card, CardStatus } from './card.js';
import { Context } from './context.js';
import type { Scope, ShareMode, Protocols } from './enums.js';
import type { ReaderState } from './reader.js';

/**
 * Async wrapper around {@link Context}.
 *
 * Serialises access with an internal promise chain so concurrent
 * operations on the same context do not interleave.
 */
export class ContextAsync {
  private ctx: Context;
  private mutex: Promise<void>;

  private constructor(ctx: Context) {
    this.ctx = ctx;
    this.mutex = Promise.resolve();
  }

  /** Establish a new PC/SC context (delegates to {@link Context.establish}). */
  static establish(scope: Scope): ContextAsync {
    return new ContextAsync(Context.establish(scope));
  }

  private async lock<T>(fn: () => T): Promise<T> {
    const prev = this.mutex;
    let release: () => void;
    this.mutex = new Promise<void>((resolve) => {
      release = resolve;
    });
    await prev;
    try {
      return fn();
    } finally {
      release!();
    }
  }

  /** Returns the underlying synchronous {@link Context}. */
  getRawContext(): Context {
    return this.ctx;
  }

  /** Release the context. */
  async release(): Promise<void> {
    await this.lock(() => this.ctx.release());
  }

  /** Check whether the context is still valid. */
  async isValid(): Promise<void> {
    await this.lock(() => this.ctx.isValid());
  }

  /** Cancel any ongoing blocking operation. */
  cancel(): void {
    this.ctx.cancel();
  }

  /** List all connected readers (returns a string array). */
  async listReaders(buffer: Buffer): Promise<string[]> {
    return this.lock(() => this.ctx.listReaders(buffer).collect());
  }

  /** List all connected readers into an owned array. */
  async listReadersOwned(): Promise<string[]> {
    return this.lock(() => this.ctx.listReadersOwned());
  }

  /** Connect to a smart card. Returns an {@link CardAsync}. */
  async connect(reader: string, shareMode: ShareMode, preferredProtocols: Protocols): Promise<CardAsync> {
    return this.lock(() => {
      const card = this.ctx.connect(reader, shareMode, preferredProtocols);
      return new CardAsync(card);
    });
  }

  /** Wait for reader state changes (blocking — see module note). */
  async getStatusChange(timeout: number | null, readers: ReaderState[]): Promise<void> {
    return this.lock(() => this.ctx.getStatusChange(timeout, readers));
  }
}

/**
 * Async wrapper around {@link Card}.
 */
export class CardAsync {
  private card: Card;

  constructor(card: Card) {
    this.card = card;
  }

  /** Returns the underlying synchronous {@link Card}. */
  getRawCard(): Card {
    return this.card;
  }

  /** Start a transaction on the card. */
  async transaction(): Promise<void> {
    this.card.transaction();
  }

  /** End a transaction. */
  async endTransaction(disposition: number): Promise<void> {
    this.card.disconnect(disposition);
  }

  /** Transmit an APDU command. */
  async transmit(sendBuffer: Buffer, recvBuffer: Buffer): Promise<Buffer> {
    return this.card.transmit(sendBuffer, recvBuffer);
  }

  /** Send a control command. */
  async control(controlCode: number, sendBuffer: Buffer | null, recvBuffer: Buffer | null): Promise<Buffer> {
    return this.card.control(controlCode, sendBuffer, recvBuffer);
  }

  /** Read a card attribute. */
  async getAttribute(attribute: number, buffer: Buffer): Promise<Buffer> {
    return this.card.getAttribute(attribute, buffer);
  }

  /** Get card status. */
  async status(namesBuffer: Buffer, atrBuffer: Buffer): Promise<CardStatus> {
    return this.card.status(namesBuffer, atrBuffer);
  }

  /** Disconnect from the card. */
  async disconnect(disposition: number): Promise<void> {
    this.card.disconnect(disposition);
  }
}
