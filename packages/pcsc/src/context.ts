import * as ffi from '@remirth/pcsc-sys';

import { allocUint32, readUint32, READER_STATE_SIZE } from './buffer.js';
import { Card } from './card.js';
import { Scope, ShareMode, Protocols, Protocol, Protocol as ProtocolEnum } from './enums.js';
import { Error, checkResult, errorFromRaw } from './error.js';
import type { ReaderState } from './reader.js';
import { ReaderNames } from './reader.js';

export class Context {
  private handle: ffi.RawContext;

  private constructor(handle: ffi.RawContext) {
    this.handle = handle;
  }

  static establish(scope: Scope): Context {
    const phCtx = Buffer.alloc(8);
    const r = ffi.raw();
    checkResult(r.SCardEstablishContext(scope, null, null, phCtx));
    const handle = ffi.isWindows ? phCtx.readBigUInt64LE(0) : phCtx.readInt32LE(0);
    return new Context(handle);
  }

  release(): void {
    const r = ffi.raw();
    const result = r.SCardReleaseContext(this.handle);
    if (result === ffi.SCARD_S_SUCCESS) {
      return;
    }
    if (result === ffi.SCARD_E_CANT_DISPOSE) {
      throw errorFromRaw(result);
    }
  }

  isValid(): void {
    const r = ffi.raw();
    checkResult(r.SCardIsValidContext(this.handle));
  }

  cancel(): void {
    const r = ffi.raw();
    checkResult(r.SCardCancel(this.handle));
  }

  listReaders(buffer: Buffer): ReaderNames {
    const r = ffi.raw();
    const buflen = allocUint32(buffer.length);

    const result = r.SCardListReaders(this.handle, null, buffer, buflen);
    if (result === Error.NoReadersAvailable) {
      return new ReaderNames(Buffer.from([0]));
    }
    checkResult(result);

    const len = readUint32(buflen, 0);
    return new ReaderNames(buffer.subarray(0, len));
  }

  listReadersLen(): number {
    const r = ffi.raw();
    const buflen = allocUint32(0);

    const result = r.SCardListReaders(this.handle, null, null, buflen);
    if (result === Error.NoReadersAvailable) {
      return 0;
    }
    checkResult(result);
    return readUint32(buflen, 0);
  }

  listReadersOwned(): string[] {
    const len = this.listReadersLen();
    if (len === 0) return [];
    const buf = Buffer.alloc(len);
    return this.listReaders(buf).collect();
  }

  connect(reader: string, shareMode: ShareMode, preferredProtocols: Protocols): Card {
    const r = ffi.raw();
    const phCard = Buffer.alloc(8);
    const pdwActiveProtocol = allocUint32(0);

    checkResult(
      r.SCardConnect(this.handle, reader, shareMode, preferredProtocols, phCard, pdwActiveProtocol),
    );

    const cardHandle = ffi.isWindows ? phCard.readBigUInt64LE(0) : phCard.readInt32LE(0);

    const activeProtocol = ffi.isWindows
      ? protocolFromRaw(readUint32(pdwActiveProtocol, 0))
      : protocolFromRaw(readUint32(pdwActiveProtocol, 0));

    return new Card(this, cardHandle, activeProtocol);
  }

  getStatusChange(timeout: number | null, readers: ReaderState[]): void {
    const r = ffi.raw();
    const timeoutMs = timeout === null ? ffi.INFINITE : Math.min(timeout, ffi.INFINITE);

    const numReaders = readers.length;
    const structSize = READER_STATE_SIZE;
    const totalBuf = Buffer.alloc(numReaders * structSize);

    for (let i = 0; i < numReaders; i++) {
      const readerBuf = readers[i]!;
      const src = readerBuf['inner' as keyof ReaderState] as unknown as Buffer;
      src.copy(totalBuf, i * structSize);
    }

    checkResult(r.SCardGetStatusChange(this.handle, timeoutMs, totalBuf, numReaders));

    for (let i = 0; i < numReaders; i++) {
      const readerBuf = readers[i]!;
      const dest = readerBuf['inner' as keyof ReaderState] as unknown as Buffer;
      totalBuf.copy(dest, 0, i * structSize, (i + 1) * structSize);
    }
  }

  getRawHandle(): ffi.RawContext {
    return this.handle;
  }

  [Symbol.dispose](): void {
    ffi.raw().SCardReleaseContext(this.handle);
  }
}

function protocolFromRaw(raw: number): Protocol {
  switch (raw) {
    case ffi.SCARD_PROTOCOL_T0:
      return ProtocolEnum.T0;
    case ffi.SCARD_PROTOCOL_T1:
      return ProtocolEnum.T1;
    case ffi.SCARD_PROTOCOL_RAW:
      return ProtocolEnum.RAW;
    default:
      return ProtocolEnum.T0;
  }
}

export { Scope, ShareMode, Protocols, Protocol };
