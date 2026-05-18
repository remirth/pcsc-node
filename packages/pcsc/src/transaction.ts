import * as ffi from '@remirth/pcsc-sys';
import { Disposition, ShareMode, Protocols } from './enums.js';
import { checkResult } from './error.js';
import type { Card } from './card.js';

export class Transaction {
  private card: Card;
  private ended: boolean;

  constructor(card: Card) {
    this.card = card;
    this.ended = false;
  }

  getCard(): Card {
    return this.card;
  }

  end(disposition: Disposition): void {
    if (this.ended) return;
    this.ended = true;
    const r = ffi.raw();
    checkResult(r.SCardEndTransaction(this.card.getRawHandle(), disposition));
  }

  reconnect(shareMode: ShareMode, preferredProtocols: Protocols, initialization: Disposition): void {
    this.card.reconnect(shareMode, preferredProtocols, initialization);
  }

  [Symbol.dispose](): void {
    this.end(Disposition.LeaveCard);
  }
}
