import { platform } from 'node:os';

import {
  DWORD_TYPE,
  LONG_TYPE,
  SCARDCONTEXT_TYPE,
  SCARDHANDLE_TYPE,
  type FfiPrimitiveType,
} from '../types.js';

export function getLibraryName(suffix: string): string {
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

export interface FfiDefinition {
  parameters: FfiPrimitiveType[];
  result: FfiPrimitiveType;
}

export function buildDefinitions(): Record<string, FfiDefinition> {
  return {
    SCardEstablishContext: {
      parameters: [DWORD_TYPE, 'pointer', 'pointer', 'pointer'],
      result: LONG_TYPE,
    },
    SCardReleaseContext: {
      parameters: [SCARDCONTEXT_TYPE],
      result: LONG_TYPE,
    },
    SCardIsValidContext: {
      parameters: [SCARDCONTEXT_TYPE],
      result: LONG_TYPE,
    },
    SCardCancel: {
      parameters: [SCARDCONTEXT_TYPE],
      result: LONG_TYPE,
    },
    SCardConnect: {
      parameters: [SCARDCONTEXT_TYPE, 'string', DWORD_TYPE, DWORD_TYPE, 'pointer', 'pointer'],
      result: LONG_TYPE,
    },
    SCardReconnect: {
      parameters: [SCARDHANDLE_TYPE, DWORD_TYPE, DWORD_TYPE, DWORD_TYPE, 'pointer'],
      result: LONG_TYPE,
    },
    SCardDisconnect: {
      parameters: [SCARDHANDLE_TYPE, DWORD_TYPE],
      result: LONG_TYPE,
    },
    SCardGetStatusChange: {
      parameters: [SCARDCONTEXT_TYPE, DWORD_TYPE, 'pointer', DWORD_TYPE],
      result: LONG_TYPE,
    },
    SCardListReaders: {
      parameters: [SCARDCONTEXT_TYPE, 'pointer', 'pointer', 'pointer'],
      result: LONG_TYPE,
    },
    SCardBeginTransaction: {
      parameters: [SCARDHANDLE_TYPE],
      result: LONG_TYPE,
    },
    SCardEndTransaction: {
      parameters: [SCARDHANDLE_TYPE, DWORD_TYPE],
      result: LONG_TYPE,
    },
    SCardStatus: {
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
      parameters: [SCARDHANDLE_TYPE, DWORD_TYPE, 'pointer', 'pointer'],
      result: LONG_TYPE,
    },
    SCardSetAttrib: {
      parameters: [SCARDHANDLE_TYPE, DWORD_TYPE, 'pointer', DWORD_TYPE],
      result: LONG_TYPE,
    },
    SCardTransmit: {
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
