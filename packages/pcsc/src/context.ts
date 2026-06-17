/**
 * PC/SC library context.
 *
 * The {@link Context} class wraps a `SCARDCONTEXT` handle and provides
 * methods for listing readers, connecting to cards, and monitoring reader
 * state changes.
 *
 * Implements `Symbol.dispose` for use with
 * {@link https://github.com/tc39/proposal-explicit-resource-management | explicit resource management} (`using`).
 *
 * @module
 */

import * as ffi from '@remirth/pcsc-sys';

import { allocDword, readDword, READER_STATE_SIZE } from './buffer.ts';
import { Card } from './card.ts';
import { Scope, ShareMode, Protocols, Protocol, protocolFromRaw } from './enums.ts';
import { Error, checkResult, errorFromRaw, PCSCError } from './error.ts';
import { ReaderNames } from './reader.ts';
import type { ReaderState } from './reader.ts';

/**
 * Library context connected to the PC/SC service.
 *
 * Wraps the native `SCARDCONTEXT` handle.
 *
 * @example
 * ```ts
 * const ctx = Context.establish(Scope.User);
 * const readers = ctx.listReadersOwned();
 * const card = ctx.connect(readers[0]!, ShareMode.Shared, Protocols.ANY);
 * ```
 */
export class Context {
  private handle: ffi.RawContext;
  private released: boolean;

  private constructor(handle: ffi.RawContext) {
    this.handle = handle;
    this.released = false;
  }

  /**
   * Establish a new PC/SC context.
   *
   * Wraps `SCardEstablishContext`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#gaa1b8970169fd4883a6dc4a8f43f19b67) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardestablishcontext)).
   *
   * @param scope - The scope for the context (typically `Scope.User`).
   * @throws Any {@link Error} on failure.
   */
  static establish(scope: Scope): Context {
    const phCtx = Buffer.alloc(ffi.SCARDCONTEXT_SIZE);
    const r = ffi.raw();
    checkResult(r.SCardEstablishContext(scope, null, null, phCtx));
    const handle = ffi.readRawContext(phCtx);
    return new Context(handle);
  }

  /**
   * Release the context handle.
   *
   * Wraps `SCardReleaseContext`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#ga6aabcba7744c5c9419fdd6404f73a934) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardreleasecontext)).
   *
   * **Note:** `Context` implements `Symbol.dispose`, which automatically
   * releases the context. Call this only if you need to handle errors
   * explicitly.
   *
   * This does not consume the `Context` instance. Subsequent use of the same
   * JS object after release is invalid and may fail with PC/SC errors.
   */
  release(): void {
    this.ensureValidHandle();
    const r = ffi.raw();
    const result = r.SCardReleaseContext(this.handle);
    if (result !== ffi.SCARD_S_SUCCESS) {
      throw new PCSCError(errorFromRaw(result));
    }
    this.released = true;
  }

  /**
   * Check whether the context is still valid.
   *
   * Wraps `SCardIsValidContext`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#ga722eb66bcc44d391f700ff9065cc080b) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardisvalidcontext)).
   *
   * @throws An {@link Error} if the context is no longer valid.
   */
  isValid(): void {
    this.ensureValidHandle();
    const r = ffi.raw();
    checkResult(r.SCardIsValidContext(this.handle));
  }

  /**
   * Cancel any ongoing blocking operation on this context.
   *
   * Wraps `SCardCancel`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#gaacbbc0c6d6c0cbbeb4f4debf6fbeeee6) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardcancel)).
   *
   * This can be called from any thread to interrupt a blocking
   * {@link getStatusChange} call in progress.
   */
  cancel(): void {
    this.ensureValidHandle();
    const r = ffi.raw();
    checkResult(r.SCardCancel(this.handle));
  }

  /**
   * List all connected card readers into a caller-provided buffer.
   *
   * Wraps `SCardListReaders`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#ga93b07815789b3cf2629d439ecf20f0d9) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardlistreadersa)).
   *
   * Use {@link listReadersLen} to determine the required buffer size first.
   *
   * @param buffer - Byte buffer large enough to hold all reader names.
   * @returns An iterable {@link ReaderNames} over the NUL-separated reader names.
   * @throws `Error.InsufficientBuffer` if the buffer is too small.
   */
  listReaders(buffer: Buffer): ReaderNames {
    this.ensureValidHandle();
    const r = ffi.raw();
    const buflen = allocDword(buffer.length);

    const result = r.SCardListReaders(this.handle, null, buffer, buflen);
    if (result === Error.NoReadersAvailable) {
      return new ReaderNames(Buffer.from([0]));
    }
    checkResult(result);

    const len = readDword(buflen, 0);
    return new ReaderNames(buffer.subarray(0, len));
  }

  /**
   * Get the required buffer size (in bytes) for a {@link listReaders} call.
   *
   * Returns `0` when no readers are available.
   */
  listReadersLen(): number {
    this.ensureValidHandle();
    const r = ffi.raw();
    const buflen = allocDword(0);

    const result = r.SCardListReaders(this.handle, null, null, buflen);
    if (result === Error.NoReadersAvailable) {
      return 0;
    }
    checkResult(result);
    return readDword(buflen, 0);
  }

  /**
   * List all connected card readers as a string array (allocates internally).
   *
   * Convenience wrapper that calls {@link listReadersLen} + {@link listReaders}.
   */
  listReadersOwned(): string[] {
    const len = this.listReadersLen();
    if (len === 0) return [];
    const buf = Buffer.alloc(len);
    return this.listReaders(buf).collect();
  }

  /**
   * Connect to a smart card in the specified reader.
   *
   * Wraps `SCardConnect`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#ga4e515829752e0a8dbc4d630696a8d6a5) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardconnecta)).
   *
   * @param reader - The reader name (from {@link listReaders}).
   * @param shareMode - How the connection is shared.
   * @param preferredProtocols - Bitmask of acceptable protocols (use `Protocols.ANY`).
   * @returns A {@link Card} representing the connection.
   * @throws `Error.NoSmartcard` if no card is present.
   */
  connect(reader: string, shareMode: ShareMode, preferredProtocols: Protocols): Card {
    this.ensureValidHandle();
    const r = ffi.raw();
    const phCard = Buffer.alloc(ffi.SCARDHANDLE_SIZE);
    const pdwActiveProtocol = allocDword(0);

    checkResult(
      r.SCardConnect(this.handle, reader, shareMode, preferredProtocols, phCard, pdwActiveProtocol),
    );

    const cardHandle = ffi.readRawCard(phCard);

    const activeProtocol = protocolFromRaw(readDword(pdwActiveProtocol, 0));

    return new Card(this, cardHandle, activeProtocol);
  }

  /**
   * Wait for card reader state changes (blocking).
   *
   * Wraps `SCardGetStatusChange`
   * ([pcsclite](https://pcsclite.apdu.fr/api/group__API.html#ga33247d5d1257d59e55647c3bb717db24) |
   * [MSDN](https://learn.microsoft.com/en-us/windows/win32/api/winscard/nf-winscard-scardgetstatuschangea)).
   *
   * Blocks the calling thread until a reader state changes from the
   * stored `currentState`, or the timeout expires. The `ReaderState`
   * objects are updated in-place.
   *
   * Pass the special reader name returned by {@link PNP_NOTIFICATION} to
   * detect reader insertions and removals.
   *
   * Use {@link cancel} from another context to interrupt this call.
   *
   * @param timeout - Timeout in milliseconds, or `null`/`undefined` for infinite.
   * @param readers - Array of {@link ReaderState} objects to monitor.
   * @throws `Error.Timeout` on timeout, `Error.Cancelled` if cancelled.
   */
  getStatusChange(timeout: number | null, readers: ReaderState[]): void {
    this.ensureValidHandle();
    const r = ffi.raw();
    const timeoutMs = timeout === null ? ffi.INFINITE : Math.min(timeout, ffi.INFINITE);

    const numReaders = readers.length;
    const structSize = READER_STATE_SIZE;
    const totalBuf = Buffer.alloc(numReaders * structSize);

    for (let i = 0; i < numReaders; i++) {
      const readerBuf = readers[i]!;
      const src = readerBuf.getInnerBuffer();
      src.copy(totalBuf, i * structSize);
    }

    checkResult(r.SCardGetStatusChange(this.handle, timeoutMs, totalBuf, numReaders));

    for (let i = 0; i < numReaders; i++) {
      const readerBuf = readers[i]!;
      const dest = readerBuf.getInnerBuffer();
      totalBuf.copy(dest, 0, i * structSize, (i + 1) * structSize);
    }
  }

  /**
   * Returns the raw native context handle.
   *
   * Intended for advanced / internal use.
   */
  getRawHandle(): ffi.RawContext {
    this.ensureValidHandle();
    return this.handle;
  }

  /**
   * Releases the context. Called automatically via `using`.
   */
  [Symbol.dispose](): void {
    if (this.released) {
      return;
    }
    this.released = true;
    ffi.raw().SCardReleaseContext(this.handle);
  }

  private ensureValidHandle(): void {
    if (this.released) {
      throw new PCSCError(Error.InvalidHandle);
    }
  }
}

export { Scope, ShareMode, Protocols, Protocol };
