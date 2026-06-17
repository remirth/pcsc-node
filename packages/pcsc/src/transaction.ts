/**
 * Exclusive card transaction (RAII guard).
 *
 * @module
 */

import * as ffi from '@remirth/pcsc-sys';

import type { Card, CardStatus, CardStatusOwned } from './card.js';
import { Disposition } from './enums.js';
import type { ShareMode, Protocols, Attribute } from './enums.js';
import { checkResult } from './error.js';

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
 * const response = tx.transmit(apdu, recvBuf);
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
    this.ensureActive();
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
    const r = ffi.raw();
    checkResult(r.SCardEndTransaction(this.card.getRawHandle(), disposition));
    this.ended = true;
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
    this.ensureActive();
    this.card.reconnect(shareMode, preferredProtocols, initialization);
  }

  transmit(sendBuffer: Buffer, recvBuffer: Buffer): Buffer {
    this.ensureActive();
    return this.card.transmit(sendBuffer, recvBuffer);
  }

  transmit2(sendBuffer: Buffer, recvBuffer: Buffer): Buffer {
    this.ensureActive();
    return this.card.transmit2(sendBuffer, recvBuffer);
  }

  control(controlCode: number, sendBuffer: Buffer | null, recvBuffer: Buffer | null): Buffer {
    this.ensureActive();
    return this.card.control(controlCode, sendBuffer, recvBuffer);
  }

  status(): { status: number; protocol: number } {
    this.ensureActive();
    return this.card.status();
  }

  status2(namesBuffer: Buffer, atrBuffer: Buffer): CardStatus {
    this.ensureActive();
    return this.card.status2(namesBuffer, atrBuffer);
  }

  status2Len(): { readerLen: number; atrLen: number } {
    this.ensureActive();
    return this.card.status2Len();
  }

  status2Owned(): CardStatusOwned {
    this.ensureActive();
    return this.card.status2Owned();
  }

  getAttribute(attribute: Attribute, buffer: Buffer): Buffer {
    this.ensureActive();
    return this.card.getAttribute(attribute, buffer);
  }

  getAttributeLen(attribute: Attribute): number {
    this.ensureActive();
    return this.card.getAttributeLen(attribute);
  }

  getAttributeOwned(attribute: Attribute): Buffer {
    this.ensureActive();
    return this.card.getAttributeOwned(attribute);
  }

  setAttribute(attribute: Attribute, data: Buffer): void {
    this.ensureActive();
    this.card.setAttribute(attribute, data);
  }

  /**
   * Automatically ends the transaction with `Disposition.LeaveCard`.
   * Called via `using`.
   */
  [Symbol.dispose](): void {
    this.end(Disposition.LeaveCard);
  }

  private ensureActive(): void {
    if (this.ended) {
      throw new TypeError('Transaction has already ended');
    }
  }
}
