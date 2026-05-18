import { platform } from 'node:os';

export const isWindows = platform() === 'win32';

export type DWORD = number;
export type LONG = number;
export type RawContext = number | bigint;
export type RawCard = number | bigint;

export const SCARDCONTEXT_TYPE = isWindows ? ('pointer' as const) : ('i32' as const);
export const SCARDHANDLE_TYPE = isWindows ? ('pointer' as const) : ('i32' as const);

export const SCARD_PROTOCOL_RAW: number = isWindows ? 0x0001_0000 : 0x0000_0004;

export function scardCtlCode(code: DWORD): DWORD {
  if (isWindows) {
    return 0x0031_0000 | (code << 2);
  }
  return 0x4200_0000 + code;
}
