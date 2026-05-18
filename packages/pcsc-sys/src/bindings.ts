import { DynamicLibrary, getRawPointer, suffix, toBuffer, toString } from 'node:ffi';
import { platform } from 'node:os';

import { isWindows } from './types.js';

import type { DWORD, LONG, RawContext, RawCard } from './types.js';

const LIBNAME = getLibraryName();

function getLibraryName(): string {
  const sys = platform();
  if (sys === 'darwin') {
    return '/System/Library/Frameworks/PCSC.framework/PCSC';
  }
  if (sys === 'win32') {
    return 'WinSCard.dll';
  }
  const name = process.env.PCSC_LIB_NAME ?? `libpcsclite.${suffix}`;
  const dir = process.env.PCSC_LIB_DIR;
  if (dir) {
    return `${dir}/${name}`;
  }
  return name;
}

let _lib: DynamicLibrary | null = null;
let _functions: Record<string, (...args: unknown[]) => unknown> | null = null;

interface SCardFunctions {
  SCardEstablishContext(dwScope: DWORD, pvReserved1: null, pvReserved2: null, phContext: Buffer): LONG;
  SCardReleaseContext(hContext: RawContext): LONG;
  SCardIsValidContext(hContext: RawContext): LONG;
  SCardCancel(hContext: RawContext): LONG;
  SCardConnect(hContext: RawContext, szReader: string, dwShareMode: DWORD, dwPreferredProtocols: DWORD, phCard: Buffer, pdwActiveProtocol: Buffer): LONG;
  SCardReconnect(hCard: RawCard, dwShareMode: DWORD, dwPreferredProtocols: DWORD, dwInitialization: DWORD, pdwActiveProtocol: Buffer): LONG;
  SCardDisconnect(hCard: RawCard, dwDisposition: DWORD): LONG;
  SCardGetStatusChange(hContext: RawContext, dwTimeout: DWORD, rgReaderStates: Buffer, cReaders: DWORD): LONG;
  SCardListReaders(hContext: RawContext, mszGroups: null, mszReaders: Buffer | null, pcchReaders: Buffer): LONG;
  SCardBeginTransaction(hCard: RawCard): LONG;
  SCardEndTransaction(hCard: RawCard, dwDisposition: DWORD): LONG;
  SCardStatus(hCard: RawCard, szReaderName: Buffer | null, pcchReaderLen: Buffer | null, pdwState: Buffer | null, pdwProtocol: Buffer | null, pbAtr: Buffer | null, pcbAtrLen: Buffer | null): LONG;
  SCardGetAttrib(hCard: RawCard, dwAttrId: DWORD, pbAttr: Buffer | null, pcbAttrLen: Buffer): LONG;
  SCardSetAttrib(hCard: RawCard, dwAttrId: DWORD, pbAttr: Buffer, pcbAttrLen: DWORD): LONG;
  SCardTransmit(hCard: RawCard, pioSendPci: bigint, pbSendBuffer: Buffer, cbSendLength: DWORD, pioRecvPci: Buffer | null, pbRecvBuffer: Buffer, pcbRecvLength: Buffer): LONG;
  SCardControl(hCard: RawCard, dwControlCode: DWORD, pbSendBuffer: Buffer | null, cbSendLength: DWORD, pbRecvBuffer: Buffer | null, cbRecvLength: DWORD, lpBytesReturned: Buffer): LONG;
}

let _raw: SCardFunctions | null = null;

export function getLibrary(): DynamicLibrary {
  if (!_lib) {
    _lib = new DynamicLibrary(LIBNAME);
  }
  return _lib;
}

export function getFunctions(): Record<string, (...args: unknown[]) => unknown> {
  if (!_functions) {
    const lib = getLibrary();
    const defs = buildDefinitions();
    _functions = lib.getFunctions(defs);
  }
  return _functions;
}

function buildDefinitions(): Record<string, { parameters: string[]; result: string }> {
  const ctx = isWindows ? 'pointer' : 'i32';
  const card = isWindows ? 'pointer' : 'i32';

  return {
    SCardEstablishContext: {
      parameters: ['u32', 'pointer', 'pointer', 'pointer'],
      result: 'i32',
    },
    SCardReleaseContext: {
      parameters: [ctx],
      result: 'i32',
    },
    SCardIsValidContext: {
      parameters: [ctx],
      result: 'i32',
    },
    SCardCancel: {
      parameters: [ctx],
      result: 'i32',
    },
    SCardConnect: {
      parameters: [ctx, 'string', 'u32', 'u32', 'pointer', 'pointer'],
      result: 'i32',
    },
    SCardReconnect: {
      parameters: [card, 'u32', 'u32', 'u32', 'pointer'],
      result: 'i32',
    },
    SCardDisconnect: {
      parameters: [card, 'u32'],
      result: 'i32',
    },
    SCardGetStatusChange: {
      parameters: [ctx, 'u32', 'pointer', 'u32'],
      result: 'i32',
    },
    SCardListReaders: {
      parameters: [ctx, 'pointer', 'pointer', 'pointer'],
      result: 'i32',
    },
    SCardBeginTransaction: {
      parameters: [card],
      result: 'i32',
    },
    SCardEndTransaction: {
      parameters: [card, 'u32'],
      result: 'i32',
    },
    SCardStatus: {
      parameters: [card, 'pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer'],
      result: 'i32',
    },
    SCardGetAttrib: {
      parameters: [card, 'u32', 'pointer', 'pointer'],
      result: 'i32',
    },
    SCardSetAttrib: {
      parameters: [card, 'u32', 'pointer', 'u32'],
      result: 'i32',
    },
    SCardTransmit: {
      parameters: [card, 'pointer', 'pointer', 'u32', 'pointer', 'pointer', 'pointer'],
      result: 'i32',
    },
    SCardControl: {
      parameters: [card, 'u32', 'pointer', 'u32', 'pointer', 'u32', 'pointer'],
      result: 'i32',
    },
  };
}

export function raw(): SCardFunctions {
  if (!_raw) {
    const fns = getFunctions();
    _raw = fns as unknown as SCardFunctions;
  }
  return _raw;
}

export function resolveSymbol(name: string): bigint {
  const lib = getLibrary();
  return lib.getSymbol(name);
}

function resolvePci(name: string): bigint {
  return resolveSymbol(name);
}

let _t0PciPtr: bigint | null = null;
let _t1PciPtr: bigint | null = null;
let _rawPciPtr: bigint | null = null;

export function getT0Pci(): bigint {
  if (_t0PciPtr === null) {
    _t0PciPtr = resolvePci('g_rgSCardT0Pci');
  }
  return _t0PciPtr;
}

export function getT1Pci(): bigint {
  if (_t1PciPtr === null) {
    _t1PciPtr = resolvePci('g_rgSCardT1Pci');
  }
  return _t1PciPtr;
}

export function getRawPci(): bigint {
  if (_rawPciPtr === null) {
    _rawPciPtr = resolvePci('g_rgSCardRawPci');
  }
  return _rawPciPtr;
}

export { toString, toBuffer, getRawPointer };
