import * as ffi from '@remirth/pcsc-sys';

import { allocUint32, readUint32 } from './buffer.js';
import type { Context } from './context.js';
import type { ShareMode, Protocols, Status, Attribute } from './enums.js';
import { Disposition, Protocol, protocolFromRaw } from './enums.js';
import { Error, checkResult } from './error.js';
import { ReaderNames } from './reader.js';
import { Transaction } from './transaction.js';

export interface CardStatus {
  readerNames: ReaderNames;
  status: Status;
  protocol: Protocol | undefined;
  atr: Buffer;
}

export class Card {
  private _context: Context;
  private handle: ffi.RawCard;
  activeProtocol: Protocol | undefined;

  constructor(context: Context, handle: ffi.RawCard, activeProtocol: Protocol | undefined) {
    this._context = context;
    this.handle = handle;
    this.activeProtocol = activeProtocol;
  }

  getRawHandle(): ffi.RawCard {
    return this.handle;
  }

  transaction(): Transaction {
    const r = ffi.raw();
    checkResult(r.SCardBeginTransaction(this.handle));
    return new Transaction(this);
  }

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

  disconnect(disposition: Disposition): void {
    const r = ffi.raw();
    checkResult(r.SCardDisconnect(this.handle, disposition));
  }

  status(namesBuffer: Buffer, atrBuffer: Buffer): CardStatus {
    const r = ffi.raw();
    const readerLen = allocUint32(namesBuffer.length);
    const rawStatus = allocUint32(0);
    const rawProtocol = allocUint32(0);
    const atrLen = allocUint32(atrBuffer.length);

    checkResult(
      r.SCardStatus(this.handle, namesBuffer, readerLen, rawStatus, rawProtocol, atrBuffer, atrLen),
    );

    const readerLenVal = readUint32(readerLen, 0);
    const names = new ReaderNames(namesBuffer.subarray(0, readerLenVal));

    const status: Status = readUint32(rawStatus, 0);
    const protocol = protocolFromRaw(readUint32(rawProtocol, 0));
    const atrLenVal = readUint32(atrLen, 0);
    const atr = atrBuffer.subarray(0, atrLenVal);

    return { readerNames: names, status, protocol, atr };
  }

  statusLen(): { readerLen: number; atrLen: number } {
    const r = ffi.raw();
    const readerLenBuf = allocUint32(0);
    const atrLenBuf = allocUint32(0);

    const result = r.SCardStatus(this.handle, null, readerLenBuf, null, null, null, atrLenBuf);

    if (result === Error.InsufficientBuffer) {
      return {
        readerLen: readUint32(readerLenBuf, 0),
        atrLen: readUint32(atrLenBuf, 0),
      };
    }

    checkResult(result);
    return { readerLen: readUint32(readerLenBuf, 0), atrLen: readUint32(atrLenBuf, 0) };
  }

  getAttribute(attribute: Attribute, buffer: Buffer): Buffer {
    const r = ffi.raw();
    const attrLen = allocUint32(buffer.length);

    checkResult(r.SCardGetAttrib(this.handle, attribute, buffer, attrLen));

    const len = readUint32(attrLen, 0);
    return buffer.subarray(0, len);
  }

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

  getAttributeOwned(attribute: Attribute): Buffer {
    const len = this.getAttributeLen(attribute);
    const buf = Buffer.alloc(len);
    return this.getAttribute(attribute, buf);
  }

  setAttribute(attribute: Attribute, data: Buffer): void {
    const r = ffi.raw();
    checkResult(r.SCardSetAttrib(this.handle, attribute, data, data.length));
  }

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

  [Symbol.dispose](): void {
    void this._context;
    ffi.raw().SCardDisconnect(this.handle, Disposition.ResetCard);
  }
}

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
