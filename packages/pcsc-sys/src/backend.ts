import { createRequire } from 'node:module';

import { createKoffiBackend } from './backends/koffi.ts';
import { createNodeFfiBackend } from './backends/node-ffi.ts';
import { isMacOS, isWindows } from './types.ts';
import type { DWORD, LONG, RawCard, RawContext } from './types.ts';

export type BackendName = 'node-ffi' | 'koffi';
export type BackendMode = BackendName | 'auto';

export interface SCardFunctions {
  SCardEstablishContext(
    dwScope: DWORD,
    pvReserved1: null,
    pvReserved2: null,
    phContext: Buffer,
  ): LONG;
  SCardReleaseContext(hContext: RawContext): LONG;
  SCardIsValidContext(hContext: RawContext): LONG;
  SCardCancel(hContext: RawContext): LONG;
  SCardConnect(
    hContext: RawContext,
    szReader: string,
    dwShareMode: DWORD,
    dwPreferredProtocols: DWORD,
    phCard: Buffer,
    pdwActiveProtocol: Buffer,
  ): LONG;
  SCardReconnect(
    hCard: RawCard,
    dwShareMode: DWORD,
    dwPreferredProtocols: DWORD,
    dwInitialization: DWORD,
    pdwActiveProtocol: Buffer,
  ): LONG;
  SCardDisconnect(hCard: RawCard, dwDisposition: DWORD): LONG;
  SCardGetStatusChange(
    hContext: RawContext,
    dwTimeout: DWORD,
    rgReaderStates: Buffer,
    cReaders: DWORD,
  ): LONG;
  SCardListReaders(
    hContext: RawContext,
    mszGroups: null,
    mszReaders: Buffer | null,
    pcchReaders: Buffer,
  ): LONG;
  SCardBeginTransaction(hCard: RawCard): LONG;
  SCardEndTransaction(hCard: RawCard, dwDisposition: DWORD): LONG;
  SCardStatus(
    hCard: RawCard,
    szReaderName: Buffer | null,
    pcchReaderLen: Buffer | null,
    pdwState: Buffer | null,
    pdwProtocol: Buffer | null,
    pbAtr: Buffer | null,
    pcbAtrLen: Buffer | null,
  ): LONG;
  SCardGetAttrib(hCard: RawCard, dwAttrId: DWORD, pbAttr: Buffer | null, pcbAttrLen: Buffer): LONG;
  SCardSetAttrib(hCard: RawCard, dwAttrId: DWORD, pbAttr: Buffer, pcbAttrLen: DWORD): LONG;
  SCardTransmit(
    hCard: RawCard,
    pioSendPci: bigint,
    pbSendBuffer: Buffer,
    cbSendLength: DWORD,
    pioRecvPci: Buffer | null,
    pbRecvBuffer: Buffer,
    pcbRecvLength: Buffer,
  ): LONG;
  SCardControl(
    hCard: RawCard,
    dwControlCode: DWORD,
    pbSendBuffer: Buffer | null,
    cbSendLength: DWORD,
    pbRecvBuffer: Buffer | null,
    cbRecvLength: DWORD,
    lpBytesReturned: Buffer,
  ): LONG;
}

export interface PcscBackend {
  readonly name: BackendName;
  raw(): SCardFunctions;
  resolveSymbol(name: string): bigint;
  getRawPointer(source: Buffer | ArrayBuffer): bigint;
  toString(pointer: bigint): string | null;
  toBuffer(pointer: bigint, length: number, copy?: boolean): Buffer;
}

export interface BackendInfo {
  selected: BackendName;
  mode: BackendMode;
  nodeFfiAvailable: boolean;
  koffiAvailable: boolean;
}

let backend: PcscBackend | null = null;
let backendInfo: BackendInfo | null = null;

export function getBackend(): PcscBackend {
  if (backend !== null) {
    return backend;
  }

  const mode = getBackendMode();
  const availability = detectAvailability();

  if (mode === 'node-ffi') {
    if (!availability.nodeFfiAvailable) {
      throw new Error('PCSC_FFI_BACKEND=node-ffi was requested, but node:ffi is unavailable');
    }
    backend = loadNodeFfiBackend();
  } else if (mode === 'koffi') {
    if (!availability.koffiAvailable) {
      throw new Error('PCSC_FFI_BACKEND=koffi was requested, but koffi is unavailable');
    }
    backend = loadKoffiBackend();
  } else {
    backend = loadAutoBackend(availability);
  }

  backendInfo = {
    selected: backend.name,
    mode,
    ...availability,
  };

  return backend;
}

function loadAutoBackend(availability: {
  nodeFfiAvailable: boolean;
  koffiAvailable: boolean;
}): PcscBackend {
  const errors: Error[] = [];

  if (availability.nodeFfiAvailable) {
    try {
      return loadNodeFfiBackend();
    } catch (error) {
      errors.push(error as Error);
    }
  }

  if (availability.koffiAvailable) {
    try {
      return loadKoffiBackend();
    } catch (error) {
      errors.push(error as Error);
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, 'No supported FFI backend could be initialized');
  }

  throw new Error(
    'No supported FFI backend is available. Enable node:ffi with Node.js 26 --experimental-ffi or install koffi.',
  );
}

export function getBackendInfo(): BackendInfo {
  const current = backendInfo;
  if (current !== null) {
    return current;
  }

  const mode = getBackendMode();
  const availability = detectAvailability();
  const selected = getBackend().name;
  return {
    selected,
    mode,
    ...availability,
  };
}

function getBackendMode(): BackendMode {
  const value = process.env.PCSC_FFI_BACKEND;
  if (value === undefined || value === '' || value === 'auto') {
    return 'auto';
  }
  if (value === 'node-ffi' || value === 'koffi') {
    return value;
  }
  throw new Error(`Unsupported PCSC_FFI_BACKEND value: ${value}`);
}

function detectAvailability(): { nodeFfiAvailable: boolean; koffiAvailable: boolean } {
  const require = createRequire(import.meta.url);
  return {
    nodeFfiAvailable: isNodeFfiSupportedOnCurrentPlatform() && canLoad(require, 'node:ffi'),
    koffiAvailable: canLoad(require, 'koffi'),
  };
}

function isNodeFfiSupportedOnCurrentPlatform(): boolean {
  return isWindows || isMacOS;
}

function canLoad(require: NodeJS.Require, specifier: string): boolean {
  try {
    require(specifier);
    return true;
  } catch {
    return false;
  }
}

function loadNodeFfiBackend(): PcscBackend {
  return createNodeFfiBackend();
}

function loadKoffiBackend(): PcscBackend {
  return createKoffiBackend();
}
