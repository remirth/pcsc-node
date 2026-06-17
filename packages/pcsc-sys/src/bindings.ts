/**
 * Low-level FFI bindings to the PC/SC C library.
 *
 * Loads the PC/SC library through the selected FFI backend and exports typed
 * wrappers around the raw C functions as well as symbol resolvers for the
 * global PCI descriptors (`g_rgSCardT0Pci`, etc.).
 *
 * @module
 */

import { getBackend, getBackendInfo, type SCardFunctions } from './backend.js';

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Returns a typed view of the raw FFI function wrappers.
 *
 * This is the primary entry point for low-level PC/SC calls. All
 * functions follow the {@link https://pcsclite.apdu.fr/api/ | pcsclite C API}.
 */
export function raw(): SCardFunctions {
  return getBackend().raw();
}

/**
 * Resolves a named symbol from the loaded library.
 *
 * @param name - The exported symbol name (e.g. `'SCardTransmit'`).
 * @returns The native address as a `bigint`.
 */
export function resolveSymbol(name: string): bigint {
  return getBackend().resolveSymbol(name);
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

export function getRawPointer(source: Buffer | ArrayBuffer): bigint {
  return getBackend().getRawPointer(source);
}

export function toString(pointer: bigint): string | null {
  return getBackend().toString(pointer);
}

export function toBuffer(pointer: bigint, length: number, copy = true): Buffer {
  return getBackend().toBuffer(pointer, length, copy);
}

export { getBackendInfo };
