/**
 * Error codes returned by PC/SC operations.
 *
 * Maps 1:1 to the `SCARD_E_*` / `SCARD_W_*` / `SCARD_F_*` constants
 * from the PC/SC C API. Use {@link errorFromRaw} to convert a raw return
 * code to an {@link Error} value, and {@link errorMessage} for a
 * human-readable description.
 *
 * @see {@link https://pcsclite.apdu.fr/api/group__ErrorCodes.html | pcsclite Error Codes}
 * @see {@link https://learn.microsoft.com/en-us/windows/win32/secauthn/smart-card-return-values | MSDN Smart Card Return Values}
 *
 * @module
 */

import * as ffi from '@remirth/pcsc-sys';

/** PC/SC error codes. Each member's numeric value matches the C constant. */
export const Error = {
  Success: ffi.SCARD_S_SUCCESS,
  InternalError: ffi.SCARD_F_INTERNAL_ERROR,
  Cancelled: ffi.SCARD_E_CANCELLED,
  InvalidHandle: ffi.SCARD_E_INVALID_HANDLE,
  InvalidParameter: ffi.SCARD_E_INVALID_PARAMETER,
  InvalidTarget: ffi.SCARD_E_INVALID_TARGET,
  NoMemory: ffi.SCARD_E_NO_MEMORY,
  WaitedTooLong: ffi.SCARD_F_WAITED_TOO_LONG,
  InsufficientBuffer: ffi.SCARD_E_INSUFFICIENT_BUFFER,
  UnknownReader: ffi.SCARD_E_UNKNOWN_READER,
  Timeout: ffi.SCARD_E_TIMEOUT,
  SharingViolation: ffi.SCARD_E_SHARING_VIOLATION,
  NoSmartcard: ffi.SCARD_E_NO_SMARTCARD,
  UnknownCard: ffi.SCARD_E_UNKNOWN_CARD,
  CantDispose: ffi.SCARD_E_CANT_DISPOSE,
  ProtoMismatch: ffi.SCARD_E_PROTO_MISMATCH,
  NotReady: ffi.SCARD_E_NOT_READY,
  InvalidValue: ffi.SCARD_E_INVALID_VALUE,
  SystemCancelled: ffi.SCARD_E_SYSTEM_CANCELLED,
  CommError: ffi.SCARD_F_COMM_ERROR,
  UnknownError: ffi.SCARD_F_UNKNOWN_ERROR,
  InvalidAtr: ffi.SCARD_E_INVALID_ATR,
  NotTransacted: ffi.SCARD_E_NOT_TRANSACTED,
  ReaderUnavailable: ffi.SCARD_E_READER_UNAVAILABLE,
  Shutdown: ffi.SCARD_P_SHUTDOWN,
  PciTooSmall: ffi.SCARD_E_PCI_TOO_SMALL,
  ReaderUnsupported: ffi.SCARD_E_READER_UNSUPPORTED,
  DuplicateReader: ffi.SCARD_E_DUPLICATE_READER,
  CardUnsupported: ffi.SCARD_E_CARD_UNSUPPORTED,
  NoService: ffi.SCARD_E_NO_SERVICE,
  ServiceStopped: ffi.SCARD_E_SERVICE_STOPPED,
  UnsupportedFeature: ffi.SCARD_E_UNSUPPORTED_FEATURE,
  IccInstallation: ffi.SCARD_E_ICC_INSTALLATION,
  IccCreateorder: ffi.SCARD_E_ICC_CREATEORDER,
  DirNotFound: ffi.SCARD_E_DIR_NOT_FOUND,
  FileNotFound: ffi.SCARD_E_FILE_NOT_FOUND,
  NoDir: ffi.SCARD_E_NO_DIR,
  NoFile: ffi.SCARD_E_NO_FILE,
  NoAccess: ffi.SCARD_E_NO_ACCESS,
  WriteTooMany: ffi.SCARD_E_WRITE_TOO_MANY,
  BadSeek: ffi.SCARD_E_BAD_SEEK,
  InvalidChv: ffi.SCARD_E_INVALID_CHV,
  UnknownResMng: ffi.SCARD_E_UNKNOWN_RES_MNG,
  NoSuchCertificate: ffi.SCARD_E_NO_SUCH_CERTIFICATE,
  CertificateUnavailable: ffi.SCARD_E_CERTIFICATE_UNAVAILABLE,
  NoReadersAvailable: ffi.SCARD_E_NO_READERS_AVAILABLE,
  CommDataLost: ffi.SCARD_E_COMM_DATA_LOST,
  NoKeyContainer: ffi.SCARD_E_NO_KEY_CONTAINER,
  ServerTooBusy: ffi.SCARD_E_SERVER_TOO_BUSY,
  UnsupportedCard: ffi.SCARD_W_UNSUPPORTED_CARD,
  UnresponsiveCard: ffi.SCARD_W_UNRESPONSIVE_CARD,
  UnpoweredCard: ffi.SCARD_W_UNPOWERED_CARD,
  ResetCard: ffi.SCARD_W_RESET_CARD,
  RemovedCard: ffi.SCARD_W_REMOVED_CARD,
  SecurityViolation: ffi.SCARD_W_SECURITY_VIOLATION,
  WrongChv: ffi.SCARD_W_WRONG_CHV,
  ChvBlocked: ffi.SCARD_W_CHV_BLOCKED,
  Eof: ffi.SCARD_W_EOF,
  CancelledByUser: ffi.SCARD_W_CANCELLED_BY_USER,
  CardNotAuthenticated: ffi.SCARD_W_CARD_NOT_AUTHENTICATED,
  CacheItemNotFound: ffi.SCARD_W_CACHE_ITEM_NOT_FOUND,
  CacheItemStale: ffi.SCARD_W_CACHE_ITEM_STALE,
  CacheItemTooBig: ffi.SCARD_W_CACHE_ITEM_TOO_BIG,
} as const;

/** A PC/SC error code value. */
export type Error = (typeof Error)[keyof typeof Error];

const ERROR_MESSAGES: Record<number, string> = {
  [Error.InternalError]: 'An internal consistency check failed',
  [Error.Cancelled]: 'The action was cancelled by an SCardCancel request',
  [Error.InvalidHandle]: 'The supplied handle was invalid',
  [Error.InvalidParameter]:
    'One or more of the supplied parameters could not be properly interpreted',
  [Error.InvalidTarget]: 'Registry startup information is missing or invalid',
  [Error.NoMemory]: 'Not enough memory available to complete this command',
  [Error.WaitedTooLong]: 'An internal consistency timer has expired',
  [Error.InsufficientBuffer]:
    'The data buffer to receive returned data is too small for the returned data',
  [Error.UnknownReader]: 'The specified reader name is not recognized',
  [Error.Timeout]: 'The user-specified timeout value has expired',
  [Error.SharingViolation]:
    'The smart card cannot be accessed because of other connections outstanding',
  [Error.NoSmartcard]:
    'The operation requires a Smart Card, but no Smart Card is currently in the device',
  [Error.UnknownCard]: 'The specified smart card name is not recognized',
  [Error.CantDispose]: 'The system could not dispose of the media in the requested manner',
  [Error.ProtoMismatch]:
    'The requested protocols are incompatible with the protocol currently in use with the smart card',
  [Error.NotReady]: 'The reader or smart card is not ready to accept commands',
  [Error.InvalidValue]:
    'One or more of the supplied parameters values could not be properly interpreted',
  [Error.SystemCancelled]:
    'The action was cancelled by the system, presumably to log off or shut down',
  [Error.CommError]: 'An internal communications error has been detected',
  [Error.UnknownError]: 'An internal error has been detected, but the source is unknown',
  [Error.InvalidAtr]: 'An ATR obtained from the registry is not a valid ATR string',
  [Error.NotTransacted]: 'An attempt was made to end a non-existent transaction',
  [Error.ReaderUnavailable]: 'The specified reader is not currently available for use',
  [Error.Shutdown]: 'The operation has been aborted to allow the server application to exit',
  [Error.PciTooSmall]: 'The PCI Receive buffer was too small',
  [Error.ReaderUnsupported]: 'The reader driver does not meet minimal requirements for support',
  [Error.DuplicateReader]: 'The reader driver did not produce a unique reader name',
  [Error.CardUnsupported]: 'The smart card does not meet minimal requirements for support',
  [Error.NoService]: 'The Smart card resource manager is not running',
  [Error.ServiceStopped]: 'The Smart card resource manager has shut down',
  [Error.UnsupportedFeature]: 'This smart card does not support the requested feature',
  [Error.IccInstallation]: 'No primary provider can be found for the smart card',
  [Error.IccCreateorder]: 'The requested order of object creation is not supported',
  [Error.DirNotFound]: 'The identified directory does not exist in the smart card',
  [Error.FileNotFound]: 'The identified file does not exist in the smart card',
  [Error.NoDir]: 'The supplied path does not represent a smart card directory',
  [Error.NoFile]: 'The supplied path does not represent a smart card file',
  [Error.NoAccess]: 'Access is denied to this file',
  [Error.WriteTooMany]: 'The smart card does not have enough memory to store the information',
  [Error.BadSeek]: 'There was an error trying to set the smart card file object pointer',
  [Error.InvalidChv]: 'The supplied PIN is incorrect',
  [Error.UnknownResMng]: 'An unrecognized error code was returned from a layered component',
  [Error.NoSuchCertificate]: 'The requested certificate does not exist',
  [Error.CertificateUnavailable]: 'The requested certificate could not be obtained',
  [Error.NoReadersAvailable]: 'Cannot find a smart card reader',
  [Error.CommDataLost]:
    'A communications error with the smart card has been detected. Retry the operation',
  [Error.NoKeyContainer]: 'The requested key container does not exist on the smart card',
  [Error.ServerTooBusy]: 'The smart card resource manager is too busy to complete this operation',
  [Error.UnsupportedCard]:
    'The reader cannot communicate with the card, due to ATR string configuration conflicts',
  [Error.UnresponsiveCard]: 'The smart card is not responding to a reset',
  [Error.UnpoweredCard]:
    'Power has been removed from the smart card, so that further communication is not possible',
  [Error.ResetCard]: 'The smart card has been reset, so any shared state information is invalid',
  [Error.RemovedCard]: 'The smart card has been removed, so further communication is not possible',
  [Error.SecurityViolation]: 'Access was denied because of a security violation',
  [Error.WrongChv]: 'The card cannot be accessed because the wrong PIN was presented',
  [Error.ChvBlocked]:
    'The card cannot be accessed because the maximum number of PIN entry attempts has been reached',
  [Error.Eof]: 'The end of the smart card file has been reached',
  [Error.CancelledByUser]: 'The user pressed "Cancel" on a Smart Card Selection Dialog',
  [Error.CardNotAuthenticated]: 'No PIN was presented to the smart card',
  [Error.CacheItemNotFound]: 'The requested item could not be found in the cache',
  [Error.CacheItemStale]: 'The requested cache item is too old and was deleted from the cache',
  [Error.CacheItemTooBig]:
    'The new cache item exceeds the maximum per-item size defined for the cache',
};

const ERROR_VALUE_MAP = new Map<number, Error>();

for (const key of Object.keys(Error)) {
  const value = (Error as Record<string, unknown>)[key];
  if (typeof value === 'number') {
    ERROR_VALUE_MAP.set(value, value as Error);
  }
}

/**
 * Convert a raw `LONG` return code from the C API to an {@link Error} value.
 *
 * Unknown values are mapped to {@link Error.UnknownError}.
 *
 * @param raw - The raw `LONG` return value from a PC/SC C function.
 */
export function errorFromRaw(raw: number): Error {
  return ERROR_VALUE_MAP.get(raw) ?? Error.UnknownError;
}

/**
 * Get a human-readable description for an {@link Error} value.
 *
 * @param error - The error code to describe.
 */
export function errorMessage(error: Error): string {
  return ERROR_MESSAGES[error] ?? 'Unknown error';
}

/**
 * Assert that a PC/SC call succeeded.
 *
 * Throws the corresponding {@link Error} value if `result` is not
 * {@link ffi.SCARD_S_SUCCESS | SCARD_S_SUCCESS}.
 *
 * @param result - Raw return code from a PC/SC function.
 * @throws The error code as an {@link Error} value (a number).
 */
export function checkResult(result: number): void {
  if (result !== ffi.SCARD_S_SUCCESS) {
    throw errorFromRaw(result);
  }
}
