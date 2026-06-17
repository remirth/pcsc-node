import { platform } from 'node:os';

import {
  DWORD_TYPE,
  LONG_TYPE,
  SCARDCONTEXT_TYPE,
  SCARDHANDLE_TYPE,
  type FfiPrimitiveType,
} from '../types.js';

export function getLibraryNames(suffix: string): string[] {
  const sys = platform();
  if (sys === 'darwin') {
    return ['/System/Library/Frameworks/PCSC.framework/PCSC'];
  }
  if (sys === 'win32') {
    return ['WinSCard.dll'];
  }

  const names = process.env.PCSC_LIB_NAME
    ? [process.env.PCSC_LIB_NAME]
    : [`libpcsclite.${suffix}`, 'libpcsclite.so.1', 'libpcsclite.so', 'pcsclite'];
  const dir = process.env.PCSC_LIB_DIR;
  if (dir) {
    return names.map((name) => `${dir}/${name}`);
  }
  return names;
}

export interface FfiDefinition {
  parameters: FfiPrimitiveType[];
  result: FfiPrimitiveType;
}

export interface NamedFfiDefinition extends FfiDefinition {
  symbol: string;
}

export function buildDefinitions(): Record<string, NamedFfiDefinition> {
  const isWindows = platform() === 'win32';
  return {
    SCardEstablishContext: {
      symbol: 'SCardEstablishContext',
      parameters: [DWORD_TYPE, 'pointer', 'pointer', 'pointer'],
      result: LONG_TYPE,
    },
    SCardReleaseContext: {
      symbol: 'SCardReleaseContext',
      parameters: [SCARDCONTEXT_TYPE],
      result: LONG_TYPE,
    },
    SCardIsValidContext: {
      symbol: 'SCardIsValidContext',
      parameters: [SCARDCONTEXT_TYPE],
      result: LONG_TYPE,
    },
    SCardCancel: {
      symbol: 'SCardCancel',
      parameters: [SCARDCONTEXT_TYPE],
      result: LONG_TYPE,
    },
    SCardConnect: {
      symbol: isWindows ? 'SCardConnectA' : 'SCardConnect',
      parameters: [SCARDCONTEXT_TYPE, 'string', DWORD_TYPE, DWORD_TYPE, 'pointer', 'pointer'],
      result: LONG_TYPE,
    },
    SCardReconnect: {
      symbol: 'SCardReconnect',
      parameters: [SCARDHANDLE_TYPE, DWORD_TYPE, DWORD_TYPE, DWORD_TYPE, 'pointer'],
      result: LONG_TYPE,
    },
    SCardDisconnect: {
      symbol: 'SCardDisconnect',
      parameters: [SCARDHANDLE_TYPE, DWORD_TYPE],
      result: LONG_TYPE,
    },
    SCardGetStatusChange: {
      symbol: isWindows ? 'SCardGetStatusChangeA' : 'SCardGetStatusChange',
      parameters: [SCARDCONTEXT_TYPE, DWORD_TYPE, 'pointer', DWORD_TYPE],
      result: LONG_TYPE,
    },
    SCardListReaders: {
      symbol: isWindows ? 'SCardListReadersA' : 'SCardListReaders',
      parameters: [SCARDCONTEXT_TYPE, 'pointer', 'pointer', 'pointer'],
      result: LONG_TYPE,
    },
    SCardBeginTransaction: {
      symbol: 'SCardBeginTransaction',
      parameters: [SCARDHANDLE_TYPE],
      result: LONG_TYPE,
    },
    SCardEndTransaction: {
      symbol: 'SCardEndTransaction',
      parameters: [SCARDHANDLE_TYPE, DWORD_TYPE],
      result: LONG_TYPE,
    },
    SCardStatus: {
      symbol: isWindows ? 'SCardStatusA' : 'SCardStatus',
      parameters: [
        SCARDHANDLE_TYPE,
        'pointer',
        'pointer',
        'pointer',
        'pointer',
        'pointer',
        'pointer',
      ],
      result: LONG_TYPE,
    },
    SCardGetAttrib: {
      symbol: 'SCardGetAttrib',
      parameters: [SCARDHANDLE_TYPE, DWORD_TYPE, 'pointer', 'pointer'],
      result: LONG_TYPE,
    },
    SCardSetAttrib: {
      symbol: 'SCardSetAttrib',
      parameters: [SCARDHANDLE_TYPE, DWORD_TYPE, 'pointer', DWORD_TYPE],
      result: LONG_TYPE,
    },
    SCardTransmit: {
      symbol: 'SCardTransmit',
      parameters: [
        SCARDHANDLE_TYPE,
        'pointer',
        'pointer',
        DWORD_TYPE,
        'pointer',
        'pointer',
        'pointer',
      ],
      result: LONG_TYPE,
    },
    SCardControl: {
      symbol: 'SCardControl',
      parameters: [
        SCARDHANDLE_TYPE,
        DWORD_TYPE,
        'pointer',
        DWORD_TYPE,
        'pointer',
        DWORD_TYPE,
        'pointer',
      ],
      result: LONG_TYPE,
    },
  };
}
