/**
 * Smart card connection and APDU communication.
 *
 * @module
 */

import * as ffi from '@remirth/pcsc-sys';

import { allocUint32, readUint32 } from './buffer.js';
import type { Context } from './context.js';
import { Transaction } from './transaction.js';
import { ReaderNames } from './reader.js';
import {
  Disposition,
  Protocol,
  protocolFromRaw,
} from './enums.js';
import type {
  Protocols,
  ShareMode,
  Status,
  Attribute,
} from './enums.js';
import { Error, checkResult } from './error.js';

/**
 * Status information about a card in a reader.
 *
 * Returned by {@link Card.status}.
 */
export interface CardStatus {
  /** Iterator over the names by which the connected reader is known. */
  readerNames: ReaderNames;

  /** Current card status flags. */
  status: Status;

  /**
   * Active communication protocol, or `undefined` for direct
   * connections (no protocol negotiated).
   */
  protocol: Protocol | undefined;

  /** The card's current ATR (Answer To Reset). */
  atr: Buffer;
}

/**
 * A connection to a smart card.
 *
 * Wraps a native `SCARDHANDLE`. Created via {@link Context.connect}.
 *
 * Implements `Symbol.dispose` for use with
 * {@link https://github.com/tc39/proposal-explicit-resource-management | explicit resource management} (`using`).
 */
export class Card {
  private _context: Context;
  private handle: ffi.RawCard;

  /** The currently active communication protocol (if negotiated). */
  activeProtocol: Protocol | undefined;

  constructor(context: Context, handle: ffi.RawCard, activeProtocol: Protocol | undefined) {
    this._context = context;
    this.handle = handle;
    this.activeProtocol = activeProtocol;
  }

  /**
   * Returns the raw native card handle.
   *
   * Intended for advanced / internal use.
   */
  getRawHandle(): ffi.RawCard {
    return this.handle;
  }

  /**
   * Start a new exclusive transaction with the card.
   *
   * Wraps `SCardBeginTransaction`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#gaddb835dce01a0da1d6ca02d33ee7d861) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardbegintransaction)).
   *
   * Operations on the card for the duration of the transaction should
   * be performed through the returned {@link Transaction} object. The
   * transaction is automatically ended (via `Disposition.LeaveCard`) when
   * disposed.
   *
   * ```ts
   * using tx = card.transaction();
   * const response = tx.getCard().transmit(apdu, recvBuf);
   * // transaction ends here
   * ```
   */
  transaction(): Transaction {
    const r = ffi.raw();
    checkResult(r.SCardBeginTransaction(this.handle));
    return new Transaction(this);
  }

  /**
   * Reconnect to the card.
   *
   * Wraps `SCardReconnect`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#gad5d4393ca8c470112ad9468c44ed8940) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardreconnect)).
   *
   * @param shareMode - New share mode.
   * @param preferredProtocols - Desired protocols mask.
   * @param initialization - Disposition to apply before reconnecting.
   */
  reconnect(
    shareMode: ShareMode,
    preferredProtocols: Protocols,
    initialization: Disposition,
  ): void {
    const r = ffi.raw();
    const pdwActiveProtocol = allocUint32(0);

    checkResult(
      r.SCardReconnect(
        this.handle,
        shareMode,
        preferredProtocols,
        initialization,
        pdwActiveProtocol,
      ),
    );

    this.activeProtocol = protocolFromRaw(readUint32(pdwActiveProtocol, 0));
  }

  /**
   * Disconnect from the card.
   *
   * Wraps `SCardDisconnect`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#ga4be198045c73ec0deb79e66c0ca1738a) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scarddisconnect)).
   *
   * **Note:** `Card` implements `Symbol.dispose` which automatically
   * disconnects using `Disposition.ResetCard`. Call this only if you
   * need a different disposition or explicit error handling.
   *
   * @param disposition - What to do with the card on disconnect.
   */
  disconnect(disposition: Disposition): void {
    const r = ffi.raw();
    checkResult(r.SCardDisconnect(this.handle, disposition));
  }

  /**
   * Get current card and reader status information.
   *
   * Wraps `SCardStatus`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#gae49c3c894ad7ac12a5b896bde70d0382) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardstatusa)).
   *
   * @param namesBuffer - Buffer for reader name data.
   * @param atrBuffer - Buffer for ATR data.
   * @returns A {@link CardStatus} object referencing sub-ranges of the provided buffers.
   */
  status(namesBuffer: Buffer, atrBuffer: Buffer): CardStatus {
    const r = ffi.raw();
    const readerLen = allocUint32(namesBuffer.length);
    const rawStatus = allocUint32(0);
    const rawProtocol = allocUint32(0);
    const atrLen = allocUint32(atrBuffer.length);

    checkResult(
      r.SCardStatus(
        this.handle,
        namesBuffer,
        readerLen,
        rawStatus,
        rawProtocol,
        atrBuffer,
        atrLen,
      ),
    );

    const readerLenVal = readUint32(readerLen, 0);
    const names = new ReaderNames(namesBuffer.subarray(0, readerLenVal));

    const status = readUint32(rawStatus, 0) as Status;
    const protocol = protocolFromRaw(readUint32(rawProtocol, 0));
    const atrLenVal = readUint32(atrLen, 0);
    const atr = atrBuffer.subarray(0, atrLenVal);

    return { readerNames: names, status, protocol, atr };
  }

  /**
   * Query the required buffer sizes for a {@link status} call.
   *
   * @returns `{ readerLen, atrLen }` in bytes.
   */
  statusLen(): { readerLen: number; atrLen: number } {
    const r = ffi.raw();
    const readerLenBuf = allocUint32(0);
    const atrLenBuf = allocUint32(0);

    const result = r.SCardStatus(
      this.handle,
      null,
      readerLenBuf,
      null,
      null,
      null,
      atrLenBuf,
    );

    if (result === Error.InsufficientBuffer) {
      return {
        readerLen: readUint32(readerLenBuf, 0),
        atrLen: readUint32(atrLenBuf, 0),
      };
    }

    checkResult(result);
    return { readerLen: readUint32(readerLenBuf, 0), atrLen: readUint32(atrLenBuf, 0) };
  }

  /**
   * Read a card / reader attribute into a caller-provided buffer.
   *
   * Wraps `SCardGetAttrib`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#gad499390101d51c1dfe9351e3bc8ed7d5) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetattrib)).
   *
   * Use {@link getAttributeLen} to determine the required buffer size.
   *
   * @param attribute - Identifier from the {@link Attribute} enum.
   * @param buffer - Byte buffer to receive the attribute value.
   * @returns A subarray of `buffer` containing the attribute data.
   */
  getAttribute(attribute: Attribute, buffer: Buffer): Buffer {
    const r = ffi.raw();
    const attrLen = allocUint32(buffer.length);

    checkResult(r.SCardGetAttrib(this.handle, attribute, buffer, attrLen));

    const len = readUint32(attrLen, 0);
    return buffer.subarray(0, len);
  }

  /**
   * Query the required buffer size for {@link getAttribute}.
   *
   * @param attribute - Identifier from the {@link Attribute} enum.
   */
  getAttributeLen(attribute: Attribute): number {
    const r = ffi.raw();
    const attrLen = allocUint32(0);

    const result = r.SCardGetAttrib(this.handle, attribute, null, attrLen);
    if (result === Error.InsufficientBuffer) {
      return readUint32(attrLen, 0);
    }
    checkResult(result);
    return readUint32(attrLen, 0);
  }

  /**
   * Read a card / reader attribute into a freshly allocated buffer.
   *
   * Convenience wrapper that calls {@link getAttributeLen} + {@link getAttribute}.
   */
  getAttributeOwned(attribute: Attribute): Buffer {
    const len = this.getAttributeLen(attribute);
    const buf = Buffer.alloc(len);
    return this.getAttribute(attribute, buf);
  }

  /**
   * Set a card / reader attribute.
   *
   * Wraps `SCardSetAttrib`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#gaab5a20963f9f59c025e6f218c4763e1c) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardsetattrib)).
   *
   * @param attribute - Identifier from the {@link Attribute} enum.
   * @param data - The attribute value bytes.
   */
  setAttribute(attribute: Attribute, data: Buffer): void {
    const r = ffi.raw();
    checkResult(r.SCardSetAttrib(this.handle, attribute, data, data.length));
  }

  /**
   * Transmit an APDU command to the card and receive the response.
   *
   * Wraps `SCardTransmit`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#gac9c26ea9caad0ccc114024c414931ecd) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardtransmit)).
   *
   * Signalling is determined by the {@link activeProtocol} of the card.
   *
   * @param sendBuffer - The APDU command bytes to send.
   * @param recvBuffer - Buffer to receive the APDU response.
   * @returns A subarray of `recvBuffer` containing the response data.
   */
  transmit(sendBuffer: Buffer, recvBuffer: Buffer): Buffer {
    const r = ffi.raw();
    const recvLen = allocUint32(recvBuffer.length);

    const pciPtr = getPciPointer(this.activeProtocol);

    checkResult(
      r.SCardTransmit(
        this.handle,
        pciPtr,
        sendBuffer,
        sendBuffer.length,
        null,
        recvBuffer,
        recvLen,
      ),
    );

    const len = readUint32(recvLen, 0);
    return recvBuffer.subarray(0, len);
  }

  /**
   * Send a control command directly to the reader driver.
   *
   * Wraps `SCardControl`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#gac0ee4625ec13c23f76a189e4b39668e1) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardcontrol)).
   *
   * Control codes are platform-specific; use {@link ctlCode} to construct them.
   *
   * @param controlCode - The control code for the operation.
   * @param sendBuffer - Data to send (or `null`).
   * @param recvBuffer - Buffer to receive the response (or `null`).
   * @returns A subarray of `recvBuffer` with the returned data.
   */
  control(controlCode: number, sendBuffer: Buffer | null, recvBuffer: Buffer | null): Buffer {
    const r = ffi.raw();
    const bytesReturned = allocUint32(0);
    const recvLen = recvBuffer ? recvBuffer.length : 0;

    checkResult(
      r.SCardControl(
        this.handle,
        controlCode,
        sendBuffer,
        sendBuffer ? sendBuffer.length : 0,
        recvBuffer,
        recvLen,
        bytesReturned,
      ),
    );

    const len = readUint32(bytesReturned, 0);
    return recvBuffer ? recvBuffer.subarray(0, len) : Buffer.alloc(0);
  }

  /**
   * Disconnects the card using `Disposition.ResetCard`. Called automatically
   * via `using`.
   */
  [Symbol.dispose](): void {
    void this._context;
    ffi.raw().SCardDisconnect(this.handle, Disposition.ResetCard);
  }
}

/**
 * Returns the native PCI descriptor address for the active protocol.
 */
function getPciPointer(protocol: Protocol | undefined): bigint {
  switch (protocol) {
    case Protocol.T0:
      return ffi.getT0Pci();
    case Protocol.T1:
      return ffi.getT1Pci();
    case Protocol.RAW:
      return ffi.getRawPci();
    default:
      return ffi.getT0Pci();
  }
}
