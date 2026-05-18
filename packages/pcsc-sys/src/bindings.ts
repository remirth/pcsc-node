/**
 * Low-level FFI bindings to the PC/SC C library.
 *
 * Detects the platform at runtime and loads the appropriate native library:
 * - **Linux / BSD**: `libpcsclite.so` (configurable via `PCSC_LIB_NAME` / `PCSC_LIB_DIR`)
 * - **macOS**: `/System/Library/Frameworks/PCSC.framework/PCSC`
 * - **Windows**: `WinSCard.dll`
 *
 * Exports typed wrappers around the raw C functions as well as symbol
 * resolvers for the global PCI descriptors (`g_rgSCardT0Pci`, etc.).
 *
 * @module
 */

import { DynamicLibrary, getRawPointer, suffix, toBuffer, toString } from 'node:ffi';
import { platform } from 'node:os';

import { isWindows } from './types.js';
import type { DWORD, LONG, RawContext, RawCard } from './types.js';

/* ------------------------------------------------------------------ */
/*  Library loading                                                    */
/* ------------------------------------------------------------------ */

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

/** Internal type describing the raw C FFI function signatures. */
interface SCardFunctions {
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

let _raw: SCardFunctions | null = null;

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Returns the loaded {@link https://nodejs.org/api/ffi.html#class-dynamiclibrary | DynamicLibrary}
 * handle for the platform PC/SC library.
 *
 * The library is loaded lazily on first access.
 */
export function getLibrary(): DynamicLibrary {
  if (!_lib) {
    _lib = new DynamicLibrary(LIBNAME);
  }
  return _lib;
}

/**
 * Returns an object with all resolved PC/SC function wrappers.
 *
 * Function symbols are resolved lazily on first access.
 */
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

/**
 * Returns a typed view of the raw FFI function wrappers.
 *
 * This is the primary entry point for low-level PC/SC calls. All
 * functions follow the {@link https://pcsclite.apdu.fr/api/ | pcsclite C API}.
 */
export function raw(): SCardFunctions {
  if (!_raw) {
    const fns = getFunctions();
    _raw = fns as unknown as SCardFunctions;
  }
  return _raw;
}

/**
 * Resolves a named symbol from the loaded library.
 *
 * @param name - The exported symbol name (e.g. `'SCardTransmit'`).
 * @returns The native address as a `bigint`.
 */
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

/**
 * Returns the native address of the global `g_rgSCardT0Pci` struct
 * (T=0 protocol descriptor).
 *
 * @see {@link https://pcsclite.apdu.fr/api/group__API.html#ga9db17a517040595ba9e08e0d80d4bdf2 | SCARD_PCI_T0}
 */
export function getT0Pci(): bigint {
  if (_t0PciPtr === null) {
    _t0PciPtr = resolvePci('g_rgSCardT0Pci');
  }
  return _t0PciPtr;
}

/**
 * Returns the native address of the global `g_rgSCardT1Pci` struct
 * (T=1 protocol descriptor).
 *
 * @see {@link https://pcsclite.apdu.fr/api/group__API.html#ga181ca286ea07bbb823a68fac7ffcd26b | SCARD_PCI_T1}
 */
export function getT1Pci(): bigint {
  if (_t1PciPtr === null) {
    _t1PciPtr = resolvePci('g_rgSCardT1Pci');
  }
  return _t1PciPtr;
}

/**
 * Returns the native address of the global `g_rgSCardRawPci` struct
 * (raw protocol descriptor).
 *
 * @see {@link https://pcsclite.apdu.fr/api/group__API.html#ga5c01d5cead7f8a9591315724486eff83 | SCARD_PCI_RAW}
 */
export function getRawPci(): bigint {
  if (_rawPciPtr === null) {
    _rawPciPtr = resolvePci('g_rgSCardRawPci');
  }
  return _rawPciPtr;
}

export { toString, toBuffer, getRawPointer };
