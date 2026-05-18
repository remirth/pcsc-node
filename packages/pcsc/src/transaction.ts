/**
 * Exclusive card transaction (RAII guard).
 *
 * @module
 */

import * as ffi from '@remirth/pcsc-sys';

import { Disposition } from './enums.js';
import type { ShareMode, Protocols } from './enums.js';
import { checkResult } from './error.js';
import type { Card } from './card.js';

/**
 * An exclusive transaction with a smart card.
 *
 * Ensures uninterrupted access to the card for its duration. All other
 * operations on the same underlying card — even from other processes —
 * will block until the transaction is finished.
 *
 * Implements `Symbol.dispose` so it can be used with
 * {@link https://github.com/tc39/proposal-explicit-resource-management | explicit resource management} (`using`).
 *
 * @example
 * ```ts
 * using tx = card.transaction();
 * const response = tx.getCard().transmit(apdu, recvBuf);
 * // Transaction is automatically ended here (LeaveCard).
 * ```
 */
export class Transaction {
  private card: Card;
  private ended: boolean;

  constructor(card: Card) {
    this.card = card;
    this.ended = false;
  }

  /**
   * Return a reference to the underlying {@link Card}.
   *
   * All card operations for the duration of the transaction must be
   * performed through this reference.
   */
  getCard(): Card {
    return this.card;
  }

  /**
   * End the transaction.
   *
   * Wraps `SCardEndTransaction`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#ga0f69ed8b4f5c8e0ba872cacbc48ed5ce) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardendtransaction)).
   *
   * Safe to call multiple times; subsequent calls are no-ops.
   *
   * @param disposition - Action to take on the card when ending.
   */
  end(disposition: Disposition): void {
    if (this.ended) return;
    this.ended = true;
    const r = ffi.raw();
    checkResult(r.SCardEndTransaction(this.card.getRawHandle(), disposition));
  }

  /**
   * Reconnect the card within the transaction.
   *
   * Delegates to {@link Card.reconnect}.
   */
  reconnect(
    shareMode: ShareMode,
    preferredProtocols: Protocols,
    initialization: Disposition,
  ): void {
    this.card.reconnect(shareMode, preferredProtocols, initialization);
  }

  /**
   * Automatically ends the transaction with `Disposition.LeaveCard`.
   * Called via `using`.
   */
  [Symbol.dispose](): void {
    this.end(Disposition.LeaveCard);
  }
}
