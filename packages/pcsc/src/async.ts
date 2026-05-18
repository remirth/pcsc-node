import type { Card, CardStatus } from './card.js';
import { Context } from './context.js';
import type { Scope, ShareMode, Protocols } from './enums.js';
import type { ReaderState } from './reader.js';

export class ContextAsync {
  private ctx: Context;
  private mutex: Promise<void>;

  private constructor(ctx: Context) {
    this.ctx = ctx;
    this.mutex = Promise.resolve();
  }

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

  getRawContext(): Context {
    return this.ctx;
  }

  async release(): Promise<void> {
    await this.lock(() => this.ctx.release());
  }

  async isValid(): Promise<void> {
    await this.lock(() => this.ctx.isValid());
  }

  cancel(): void {
    this.ctx.cancel();
  }

  async listReaders(buffer: Buffer): Promise<string[]> {
    return this.lock(() => this.ctx.listReaders(buffer).collect());
  }

  async listReadersOwned(): Promise<string[]> {
    return this.lock(() => this.ctx.listReadersOwned());
  }

  async connect(
    reader: string,
    shareMode: ShareMode,
    preferredProtocols: Protocols,
  ): Promise<CardAsync> {
    return this.lock(() => {
      const card = this.ctx.connect(reader, shareMode, preferredProtocols);
      return new CardAsync(card);
    });
  }

  async getStatusChange(timeout: number | null, readers: ReaderState[]): Promise<void> {
    return this.lock(() => this.ctx.getStatusChange(timeout, readers));
  }
}

export class CardAsync {
  private card: Card;

  constructor(card: Card) {
    this.card = card;
  }

  getRawCard(): Card {
    return this.card;
  }

  async transaction(): Promise<void> {
    this.card.transaction();
  }

  async endTransaction(disposition: number): Promise<void> {
    this.card.disconnect(disposition);
  }

  async transmit(sendBuffer: Buffer, recvBuffer: Buffer): Promise<Buffer> {
    return this.card.transmit(sendBuffer, recvBuffer);
  }

  async control(
    controlCode: number,
    sendBuffer: Buffer | null,
    recvBuffer: Buffer | null,
  ): Promise<Buffer> {
    return this.card.control(controlCode, sendBuffer, recvBuffer);
  }

  async getAttribute(attribute: number, buffer: Buffer): Promise<Buffer> {
    return this.card.getAttribute(attribute, buffer);
  }

  async status(namesBuffer: Buffer, atrBuffer: Buffer): Promise<CardStatus> {
    return this.card.status(namesBuffer, atrBuffer);
  }

  async disconnect(disposition: number): Promise<void> {
    this.card.disconnect(disposition);
  }
}
