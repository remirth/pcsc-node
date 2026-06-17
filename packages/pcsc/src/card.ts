/**
 * Smart card connection and APDU communication.
 *
 * @module
 */

import * as ffi from '@remirth/pcsc-sys';

import { allocDword, readDword } from './buffer.ts';
import type { Context } from './context.ts';
import { Disposition, Protocol, protocolFromRaw, statusFromRaw } from './enums.ts';
import type { Protocols, ShareMode, Status, Attribute } from './enums.ts';
import { Error, checkResult, errorFromRaw } from './error.ts';
import { ReaderNames } from './reader.ts';
import { Transaction } from './transaction.ts';

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

  /** The card's current ATR (Answer To Reset). */
  atr: Buffer;

  /** Current protocol, or `undefined` for direct connections. */
  protocol2(): Protocol | undefined;

  /**
   * Current protocol.
   *
   * Throws when connected directly to a reader without an active protocol.
   */
  protocol(): Protocol;
}

/**
 * Owned version of {@link CardStatus}.
 */
export interface CardStatusOwned {
  readerNames: string[];
  status: Status;
  atr: Buffer;
  protocol2(): Protocol | undefined;
  protocol(): Protocol;
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
  private disconnected: boolean;

  /** The currently active communication protocol (if negotiated). */
  activeProtocol: Protocol | undefined;

  constructor(context: Context, handle: ffi.RawCard, activeProtocol: Protocol | undefined) {
    this._context = context;
    this.handle = handle;
    this.activeProtocol = activeProtocol;
    this.disconnected = false;
  }

  /**
   * Returns the raw native card handle.
   *
   * Intended for advanced / internal use.
   */
  getRawHandle(): ffi.RawCard {
    this.ensureConnected();
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
   * const response = tx.transmit(apdu, recvBuf);
   * // transaction ends here
   * ```
   */
  transaction(): Transaction {
    this.ensureConnected();
    const r = ffi.raw();
    checkResult(r.SCardBeginTransaction(this.handle));
    return new Transaction(this);
  }

  transaction2(): Transaction {
    this.ensureConnected();
    const r = ffi.raw();
    const result = r.SCardBeginTransaction(this.handle);
    if (result !== ffi.SCARD_S_SUCCESS) {
      throw [this, errorFromRaw(result)] as const;
    }
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
    this.ensureConnected();
    const r = ffi.raw();
    const pdwActiveProtocol = allocDword(0);

    checkResult(
      r.SCardReconnect(
        this.handle,
        shareMode,
        preferredProtocols,
        initialization,
        pdwActiveProtocol,
      ),
    );

    this.activeProtocol = protocolFromRaw(readDword(pdwActiveProtocol, 0));
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
    this.ensureConnected();
    const r = ffi.raw();
    checkResult(r.SCardDisconnect(this.handle, disposition));
    this.disconnected = true;
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
   * @deprecated Use {@link status2} or {@link status2Owned} instead.
   */
  status(): { status: Status; protocol: Protocol } {
    this.ensureConnected();
    const r = ffi.raw();
    const rawStatus = allocDword(0);
    const rawProtocol = allocDword(0);

    checkResult(r.SCardStatus(this.handle, null, null, rawStatus, rawProtocol, null, null));

    const status = statusFromRaw(readDword(rawStatus, 0));
    const protocol = protocolFromRaw(readDword(rawProtocol, 0));
    if (protocol === undefined) {
      throw new TypeError(
        'pcsc::CardStatus::protocol() does not support direct connections; use status2() instead',
      );
    }

    return { status, protocol };
  }

  /**
   * Get current card and reader status information.
   *
   * Wraps `SCardStatus` with caller-provided buffers, matching upstream
   * `status2()`.
   */
  status2(namesBuffer: Buffer, atrBuffer: Buffer): CardStatus {
    this.ensureConnected();
    const r = ffi.raw();
    const readerLen = allocDword(namesBuffer.length);
    const rawStatus = allocDword(0);
    const rawProtocol = allocDword(0);
    const atrLen = allocDword(atrBuffer.length);

    checkResult(
      r.SCardStatus(this.handle, namesBuffer, readerLen, rawStatus, rawProtocol, atrBuffer, atrLen),
    );

    const readerLenVal = readDword(readerLen, 0);
    const names = new ReaderNames(namesBuffer.subarray(0, readerLenVal));

    const status = statusFromRaw(readDword(rawStatus, 0));
    const protocol = protocolFromRaw(readDword(rawProtocol, 0));
    const atrLenVal = readDword(atrLen, 0);
    const atr = atrBuffer.subarray(0, atrLenVal);

    return {
      readerNames: names,
      status,
      atr,
      protocol2: () => protocol,
      protocol: () => requireProtocol(protocol),
    };
  }

  /**
   * Query the required buffer sizes for a {@link status} call.
   *
   * @returns `{ readerLen, atrLen }` in bytes.
   */
  status2Len(): { readerLen: number; atrLen: number } {
    this.ensureConnected();
    const r = ffi.raw();
    const readerLenBuf = allocDword(0);
    const atrLenBuf = allocDword(0);

    const result = r.SCardStatus(this.handle, null, readerLenBuf, null, null, null, atrLenBuf);

    if (result === Error.InsufficientBuffer) {
      return {
        readerLen: readDword(readerLenBuf, 0),
        atrLen: readDword(atrLenBuf, 0),
      };
    }

    checkResult(result);
    return { readerLen: readDword(readerLenBuf, 0), atrLen: readDword(atrLenBuf, 0) };
  }

  statusLen(): { readerLen: number; atrLen: number } {
    return this.status2Len();
  }

  status2Owned(): CardStatusOwned {
    const { readerLen, atrLen } = this.status2Len();
    const namesBuffer = Buffer.alloc(readerLen);
    const atrBuffer = Buffer.alloc(atrLen);
    const status = this.status2(namesBuffer, atrBuffer);
    const protocol = status.protocol2();
    return {
      readerNames: status.readerNames.collect(),
      status: status.status,
      atr: Buffer.from(status.atr),
      protocol2: () => protocol,
      protocol: () => requireProtocol(protocol),
    };
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
    this.ensureConnected();
    const r = ffi.raw();
    const attrLen = allocDword(buffer.length);

    checkResult(r.SCardGetAttrib(this.handle, attribute, buffer, attrLen));

    const len = readDword(attrLen, 0);
    return buffer.subarray(0, len);
  }

  /**
   * Query the required buffer size for {@link getAttribute}.
   *
   * @param attribute - Identifier from the {@link Attribute} enum.
   */
  getAttributeLen(attribute: Attribute): number {
    this.ensureConnected();
    const r = ffi.raw();
    const attrLen = allocDword(0);

    const result = r.SCardGetAttrib(this.handle, attribute, null, attrLen);
    if (result === Error.InsufficientBuffer) {
      return readDword(attrLen, 0);
    }
    checkResult(result);
    return readDword(attrLen, 0);
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
    this.ensureConnected();
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
    this.ensureConnected();
    const r = ffi.raw();
    const recvLen = allocDword(recvBuffer.length);

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

    const len = readDword(recvLen, 0);
    return recvBuffer.subarray(0, len);
  }

  transmit2(sendBuffer: Buffer, recvBuffer: Buffer): Buffer {
    this.ensureConnected();
    const r = ffi.raw();
    const recvLen = allocDword(recvBuffer.length);
    const pciPtr = getPciPointer(this.activeProtocol);

    const result = r.SCardTransmit(
      this.handle,
      pciPtr,
      sendBuffer,
      sendBuffer.length,
      null,
      recvBuffer,
      recvLen,
    );

    if (result !== ffi.SCARD_S_SUCCESS) {
      throw [errorFromRaw(result), readDword(recvLen, 0)] as const;
    }

    const len = readDword(recvLen, 0);
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
    this.ensureConnected();
    const r = ffi.raw();
    const bytesReturned = allocDword(0);
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

    const len = readDword(bytesReturned, 0);
    return recvBuffer ? recvBuffer.subarray(0, len) : Buffer.alloc(0);
  }

  /**
   * Disconnects the card using `Disposition.ResetCard`. Called automatically
   * via `using`.
   */
  [Symbol.dispose](): void {
    if (this.disconnected) {
      return;
    }
    this.disconnected = true;
    void this._context;
    ffi.raw().SCardDisconnect(this.handle, Disposition.ResetCard);
  }

  private ensureConnected(): void {
    if (this.disconnected) {
      throw Error.InvalidHandle;
    }
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
      throw new TypeError('pcsc::Card::transmit() does not support direct connections');
  }
}

function requireProtocol(protocol: Protocol | undefined): Protocol {
  if (protocol === undefined) {
    throw new TypeError(
      'pcsc::CardStatus::protocol() does not support direct connections; use protocol2() instead',
    );
  }
  return protocol;
}
