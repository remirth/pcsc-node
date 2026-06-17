/**
 * PC/SC C API numeric constants.
 *
 * Mirrors the constants defined by upstream `pcsc-sys`.
 *
 * @module
 */

import { isWindows } from './types.ts';

/* ------------------------------------------------------------------ */
/*  Return codes                                                      */
/* ------------------------------------------------------------------ */

/** Operation completed successfully. */
export const SCARD_S_SUCCESS = 0x0000_0000;

/** An internal consistency check failed. */
export const SCARD_F_INTERNAL_ERROR = 0x8010_0001;

/** The action was cancelled by an `SCardCancel` request. */
export const SCARD_E_CANCELLED = 0x8010_0002;

/** The supplied handle was invalid. */
export const SCARD_E_INVALID_HANDLE = 0x8010_0003;

/** One or more of the supplied parameters could not be properly interpreted. */
export const SCARD_E_INVALID_PARAMETER = 0x8010_0004;

/** Registry startup information is missing or invalid. */
export const SCARD_E_INVALID_TARGET = 0x8010_0005;

/** Not enough memory available to complete this command. */
export const SCARD_E_NO_MEMORY = 0x8010_0006;

/** An internal consistency timer has expired. */
export const SCARD_F_WAITED_TOO_LONG = 0x8010_0007;

/** The data buffer is too small for the returned data. */
export const SCARD_E_INSUFFICIENT_BUFFER = 0x8010_0008;

/** The specified reader name is not recognised. */
export const SCARD_E_UNKNOWN_READER = 0x8010_0009;

/** The user-specified timeout value has expired. */
export const SCARD_E_TIMEOUT = 0x8010_000a;

/** The smart card cannot be accessed because of other outstanding connections. */
export const SCARD_E_SHARING_VIOLATION = 0x8010_000b;

/** The operation requires a smart card, but no smart card is present. */
export const SCARD_E_NO_SMARTCARD = 0x8010_000c;

/** The specified smart card name is not recognised. */
export const SCARD_E_UNKNOWN_CARD = 0x8010_000d;

/** The system could not dispose of the media in the requested manner. */
export const SCARD_E_CANT_DISPOSE = 0x8010_000e;

/** The requested protocols are incompatible with the protocol currently in use. */
export const SCARD_E_PROTO_MISMATCH = 0x8010_000f;

/** The reader or smart card is not ready to accept commands. */
export const SCARD_E_NOT_READY = 0x8010_0010;

/** One or more of the supplied parameter values could not be properly interpreted. */
export const SCARD_E_INVALID_VALUE = 0x8010_0011;

/** The action was cancelled by the system. */
export const SCARD_E_SYSTEM_CANCELLED = 0x8010_0012;

/** An internal communications error has been detected. */
export const SCARD_F_COMM_ERROR = 0x8010_0013;

/** An unknown internal error has been detected. */
export const SCARD_F_UNKNOWN_ERROR = 0x8010_0014;

/** An ATR string obtained from the registry is not valid. */
export const SCARD_E_INVALID_ATR = 0x8010_0015;

/** An attempt was made to end a non-existent transaction. */
export const SCARD_E_NOT_TRANSACTED = 0x8010_0016;

/** The specified reader is not currently available. */
export const SCARD_E_READER_UNAVAILABLE = 0x8010_0017;

/** The operation has been aborted to allow the server to exit. */
export const SCARD_P_SHUTDOWN = 0x8010_0018;

/** The PCI receive buffer was too small. */
export const SCARD_E_PCI_TOO_SMALL = 0x8010_0019;

/** The reader driver does not meet minimal requirements. */
export const SCARD_E_READER_UNSUPPORTED = 0x8010_001a;

/** The reader driver did not produce a unique reader name. */
export const SCARD_E_DUPLICATE_READER = 0x8010_001b;

/** The smart card does not meet minimal requirements. */
export const SCARD_E_CARD_UNSUPPORTED = 0x8010_001c;

/** The smart card resource manager is not running. */
export const SCARD_E_NO_SERVICE = 0x8010_001d;

/** The smart card resource manager has shut down. */
export const SCARD_E_SERVICE_STOPPED = 0x8010_001e;

/** An unexpected card error has occurred. (On non-Windows: same value as `SCARD_E_UNSUPPORTED_FEATURE`.) */
export const SCARD_E_UNEXPECTED = 0x8010_001f;

/** No primary provider can be found for the smart card. */
export const SCARD_E_ICC_INSTALLATION = 0x8010_0020;

/** The requested order of object creation is not supported. */
export const SCARD_E_ICC_CREATEORDER = 0x8010_0021;

/** The identified directory does not exist in the smart card. */
export const SCARD_E_DIR_NOT_FOUND = 0x8010_0023;

/** The identified file does not exist in the smart card. */
export const SCARD_E_FILE_NOT_FOUND = 0x8010_0024;

/** The supplied path does not represent a smart card directory. */
export const SCARD_E_NO_DIR = 0x8010_0025;

/** The supplied path does not represent a smart card file. */
export const SCARD_E_NO_FILE = 0x8010_0026;

/** Access is denied to this file. */
export const SCARD_E_NO_ACCESS = 0x8010_0027;

/** The smart card does not have enough memory. */
export const SCARD_E_WRITE_TOO_MANY = 0x8010_0028;

/** There was an error trying to set the file object pointer. */
export const SCARD_E_BAD_SEEK = 0x8010_0029;

/** The supplied PIN is incorrect. */
export const SCARD_E_INVALID_CHV = 0x8010_002a;

/** An unrecognised error code was returned. */
export const SCARD_E_UNKNOWN_RES_MNG = 0x8010_002b;

/** The requested certificate does not exist. */
export const SCARD_E_NO_SUCH_CERTIFICATE = 0x8010_002c;

/** The requested certificate could not be obtained. */
export const SCARD_E_CERTIFICATE_UNAVAILABLE = 0x8010_002d;

/** Cannot find a smart card reader. */
export const SCARD_E_NO_READERS_AVAILABLE = 0x8010_002e;

/** A communications error with the smart card has been detected. */
export const SCARD_E_COMM_DATA_LOST = 0x8010_002f;

/** The requested key container does not exist. */
export const SCARD_E_NO_KEY_CONTAINER = 0x8010_0030;

/** The smart card resource manager is too busy. */
export const SCARD_E_SERVER_TOO_BUSY = 0x8010_0031;

/** This smart card does not support the requested feature. (Value shared with `SCARD_E_UNEXPECTED` on non-Windows.) */
export const SCARD_E_UNSUPPORTED_FEATURE = isWindows ? 0x8010_0022 : 0x8010_001f;

/** The reader cannot communicate with the card (ATR string configuration conflict). */
export const SCARD_W_UNSUPPORTED_CARD = 0x8010_0065;

/** The smart card is not responding to a reset. */
export const SCARD_W_UNRESPONSIVE_CARD = 0x8010_0066;

/** Power has been removed from the smart card. */
export const SCARD_W_UNPOWERED_CARD = 0x8010_0067;

/** The smart card has been reset. */
export const SCARD_W_RESET_CARD = 0x8010_0068;

/** The smart card has been removed. */
export const SCARD_W_REMOVED_CARD = 0x8010_0069;

/** Access was denied because of a security violation. */
export const SCARD_W_SECURITY_VIOLATION = 0x8010_006a;

/** The card cannot be accessed because the wrong PIN was presented. */
export const SCARD_W_WRONG_CHV = 0x8010_006b;

/** The card cannot be accessed because the max PIN attempts have been reached. */
export const SCARD_W_CHV_BLOCKED = 0x8010_006c;

/** The end of the smart card file has been reached. */
export const SCARD_W_EOF = 0x8010_006d;

/** The user pressed "Cancel" on a Smart Card Selection Dialog. */
export const SCARD_W_CANCELLED_BY_USER = 0x8010_006e;

/** No PIN was presented to the smart card. */
export const SCARD_W_CARD_NOT_AUTHENTICATED = 0x8010_006f;

/** The requested item could not be found in the cache. */
export const SCARD_W_CACHE_ITEM_NOT_FOUND = 0x8010_0070;

/** The requested cache item is too old and was deleted. */
export const SCARD_W_CACHE_ITEM_STALE = 0x8010_0071;

/** The new cache item exceeds the max per-item size. */
export const SCARD_W_CACHE_ITEM_TOO_BIG = 0x8010_0072;

/* ------------------------------------------------------------------ */
/*  Context scope                                                     */
/* ------------------------------------------------------------------ */

/** Scope: user context. */
export const SCARD_SCOPE_USER = 0x0000;

/** Scope: terminal context. */
export const SCARD_SCOPE_TERMINAL = 0x0001;

/** Scope: system context. */
export const SCARD_SCOPE_SYSTEM = 0x0002;

/** Scope: global context. */
export const SCARD_SCOPE_GLOBAL = 0x0003;

/* ------------------------------------------------------------------ */
/*  Protocols                                                         */
/* ------------------------------------------------------------------ */

/** No protocol. */
export const SCARD_PROTOCOL_UNDEFINED = 0x0000_0000;

/** Alias for `SCARD_PROTOCOL_UNDEFINED`. */
export const SCARD_PROTOCOL_UNSET = SCARD_PROTOCOL_UNDEFINED;

/** T=0 protocol. */
export const SCARD_PROTOCOL_T0 = 0x0000_0001;

/** T=1 protocol. */
export const SCARD_PROTOCOL_T1 = 0x0000_0002;

/** T=15 (ISO 14443) protocol. */
export const SCARD_PROTOCOL_T15 = 0x0000_0008;

/** Mask matching any protocol (T=0 | T=1). */
export const SCARD_PROTOCOL_ANY = SCARD_PROTOCOL_T0 | SCARD_PROTOCOL_T1;

/* ------------------------------------------------------------------ */
/*  Share modes                                                       */
/* ------------------------------------------------------------------ */

/** Exclusive connection. */
export const SCARD_SHARE_EXCLUSIVE = 0x0001;

/** Shared connection. */
export const SCARD_SHARE_SHARED = 0x0002;

/** Direct connection (no protocol). */
export const SCARD_SHARE_DIRECT = 0x0003;

/* ------------------------------------------------------------------ */
/*  Disposition                                                       */
/* ------------------------------------------------------------------ */

/** Do nothing (leave the card as-is). */
export const SCARD_LEAVE_CARD = 0x0000;

/** Reset the card. */
export const SCARD_RESET_CARD = 0x0001;

/** Unpower the card. */
export const SCARD_UNPOWER_CARD = 0x0002;

/** Eject the card. */
export const SCARD_EJECT_CARD = 0x0003;

/* ------------------------------------------------------------------ */
/*  Reader states                                                     */
/* ------------------------------------------------------------------ */

/** Unknown card status. Bitmask on non-Windows, ordinal on Windows. */
export const SCARD_UNKNOWN = isWindows ? 0 : 0x0001;

/** No card present. Bitmask on non-Windows, ordinal on Windows. */
export const SCARD_ABSENT = isWindows ? 1 : 0x0002;

/** Card present. Bitmask on non-Windows, ordinal on Windows. */
export const SCARD_PRESENT = isWindows ? 2 : 0x0004;

/** Card present in reader, position uncertain. Bitmask on non-Windows, ordinal on Windows. */
export const SCARD_SWALLOWED = isWindows ? 3 : 0x0008;

/** Card powered. Bitmask on non-Windows, ordinal on Windows. */
export const SCARD_POWERED = isWindows ? 4 : 0x0010;

/** Negotiable protocol active. Bitmask on non-Windows, ordinal on Windows. */
export const SCARD_NEGOTIABLE = isWindows ? 5 : 0x0020;

/** Specific protocol active. Bitmask on non-Windows, ordinal on Windows. */
export const SCARD_SPECIFIC = isWindows ? 6 : 0x0040;

/** Application is unaware of the current state. */
export const SCARD_STATE_UNAWARE = 0x0000;

/** Ignore this reader. */
export const SCARD_STATE_IGNORE = 0x0001;

/** State has changed since last call. */
export const SCARD_STATE_CHANGED = 0x0002;

/** Reader name is known but state is unknown. */
export const SCARD_STATE_UNKNOWN = 0x0004;

/** Reader is unavailable. */
export const SCARD_STATE_UNAVAILABLE = 0x0008;

/** Reader is empty (no card). */
export const SCARD_STATE_EMPTY = 0x0010;

/** Card is present. */
export const SCARD_STATE_PRESENT = 0x0020;

/** Card ATR matches a target. */
export const SCARD_STATE_ATRMATCH = 0x0040;

/** Reader is in exclusive mode. */
export const SCARD_STATE_EXCLUSIVE = 0x0080;

/** Reader is in use. */
export const SCARD_STATE_INUSE = 0x0100;

/** Reader is muted. */
export const SCARD_STATE_MUTE = 0x0200;

/** Card is unpowered. */
export const SCARD_STATE_UNPOWERED = 0x0400;

/* ------------------------------------------------------------------ */
/*  Miscellaneous                                                     */
/* ------------------------------------------------------------------ */

/** Flag to request auto-allocation of memory. */
export const SCARD_AUTOALLOCATE = 0xffff_ffff;

/** Infinite timeout value. */
export const INFINITE = 0xffff_ffff;

/* ------------------------------------------------------------------ */
/*  Buffer sizes                                                      */
/* ------------------------------------------------------------------ */

/** Maximum size of an ATR (Answer To Reset) in bytes (33). */
export const MAX_ATR_SIZE = 33;

/** Size of the ATR buffer in `SCARD_READERSTATE`. */
export const ATR_BUFFER_SIZE = isWindows ? 36 : MAX_ATR_SIZE;

/** Alias for `MAX_ATR_SIZE`. */
export const SCARD_ATR_LENGTH = MAX_ATR_SIZE;

/** Maximum size of a short APDU command or response (264 bytes). */
export const MAX_BUFFER_SIZE = 264;

/** Maximum size of an extended APDU command or response. */
export const MAX_BUFFER_SIZE_EXTENDED = 4 + 3 + (1 << 16) + 3 + 2;

/* ------------------------------------------------------------------ */
/*  Attribute classes                                                 */
/* ------------------------------------------------------------------ */

/** Vendor information attributes. */
export const SCARD_CLASS_VENDOR_INFO = 1;

/** Communication attributes. */
export const SCARD_CLASS_COMMUNICATIONS = 2;

/** Protocol attributes. */
export const SCARD_CLASS_PROTOCOL = 3;

/** Power management attributes. */
export const SCARD_CLASS_POWER_MGMT = 4;

/** Security attributes. */
export const SCARD_CLASS_SECURITY = 5;

/** Mechanical attributes. */
export const SCARD_CLASS_MECHANICAL = 6;

/** Vendor-defined attributes. */
export const SCARD_CLASS_VENDOR_DEFINED = 7;

/** IFD protocol attributes. */
export const SCARD_CLASS_IFD_PROTOCOL = 8;

/** ICC state attributes. */
export const SCARD_CLASS_ICC_STATE = 9;

/** System attributes. */
export const SCARD_CLASS_SYSTEM = 0;

/* ------------------------------------------------------------------ */
/*  Attribute IDs (built with SCARD_ATTR_VALUE macro)                   */
/* ------------------------------------------------------------------ */

function SCARD_ATTR_VALUE(klass: number, value: number): number {
  return (klass << 16) | value;
}

/** Vendor name string. */
export const SCARD_ATTR_VENDOR_NAME = SCARD_ATTR_VALUE(SCARD_CLASS_VENDOR_INFO, 0x0100);

/** Vendor IFD type. */
export const SCARD_ATTR_VENDOR_IFD_TYPE = SCARD_ATTR_VALUE(SCARD_CLASS_VENDOR_INFO, 0x0101);

/** Vendor IFD version. */
export const SCARD_ATTR_VENDOR_IFD_VERSION = SCARD_ATTR_VALUE(SCARD_CLASS_VENDOR_INFO, 0x0102);

/** Vendor IFD serial number. */
export const SCARD_ATTR_VENDOR_IFD_SERIAL_NO = SCARD_ATTR_VALUE(SCARD_CLASS_VENDOR_INFO, 0x0103);

/** Communication channel ID. */
export const SCARD_ATTR_CHANNEL_ID = SCARD_ATTR_VALUE(SCARD_CLASS_COMMUNICATIONS, 0x0110);

/** Async protocol types. */
export const SCARD_ATTR_ASYNC_PROTOCOL_TYPES = SCARD_ATTR_VALUE(SCARD_CLASS_PROTOCOL, 0x0120);

/** Default clock rate. */
export const SCARD_ATTR_DEFAULT_CLK = SCARD_ATTR_VALUE(SCARD_CLASS_PROTOCOL, 0x0121);

/** Maximum clock rate. */
export const SCARD_ATTR_MAX_CLK = SCARD_ATTR_VALUE(SCARD_CLASS_PROTOCOL, 0x0122);

/** Default data rate. */
export const SCARD_ATTR_DEFAULT_DATA_RATE = SCARD_ATTR_VALUE(SCARD_CLASS_PROTOCOL, 0x0123);

/** Maximum data rate. */
export const SCARD_ATTR_MAX_DATA_RATE = SCARD_ATTR_VALUE(SCARD_CLASS_PROTOCOL, 0x0124);

/** Maximum IFSD. */
export const SCARD_ATTR_MAX_IFSD = SCARD_ATTR_VALUE(SCARD_CLASS_PROTOCOL, 0x0125);

/** Synchronous protocol types. */
export const SCARD_ATTR_SYNC_PROTOCOL_TYPES = SCARD_ATTR_VALUE(SCARD_CLASS_PROTOCOL, 0x0126);

/** Power management support. */
export const SCARD_ATTR_POWER_MGMT_SUPPORT = SCARD_ATTR_VALUE(SCARD_CLASS_POWER_MGMT, 0x0131);

/** User-to-card auth device. */
export const SCARD_ATTR_USER_TO_CARD_AUTH_DEVICE = SCARD_ATTR_VALUE(SCARD_CLASS_SECURITY, 0x0140);

/** User auth input device. */
export const SCARD_ATTR_USER_AUTH_INPUT_DEVICE = SCARD_ATTR_VALUE(SCARD_CLASS_SECURITY, 0x0142);

/** Mechanical characteristics. */
export const SCARD_ATTR_CHARACTERISTICS = SCARD_ATTR_VALUE(SCARD_CLASS_MECHANICAL, 0x0150);

/** Current protocol type. */
export const SCARD_ATTR_CURRENT_PROTOCOL_TYPE = SCARD_ATTR_VALUE(SCARD_CLASS_IFD_PROTOCOL, 0x0201);

/** Current clock rate. */
export const SCARD_ATTR_CURRENT_CLK = SCARD_ATTR_VALUE(SCARD_CLASS_IFD_PROTOCOL, 0x0202);

/** Current F parameter. */
export const SCARD_ATTR_CURRENT_F = SCARD_ATTR_VALUE(SCARD_CLASS_IFD_PROTOCOL, 0x0203);

/** Current D parameter. */
export const SCARD_ATTR_CURRENT_D = SCARD_ATTR_VALUE(SCARD_CLASS_IFD_PROTOCOL, 0x0204);

/** Current N parameter. */
export const SCARD_ATTR_CURRENT_N = SCARD_ATTR_VALUE(SCARD_CLASS_IFD_PROTOCOL, 0x0205);

/** Current W parameter. */
export const SCARD_ATTR_CURRENT_W = SCARD_ATTR_VALUE(SCARD_CLASS_IFD_PROTOCOL, 0x0206);

/** Current IFSC. */
export const SCARD_ATTR_CURRENT_IFSC = SCARD_ATTR_VALUE(SCARD_CLASS_IFD_PROTOCOL, 0x0207);

/** Current IFSD. */
export const SCARD_ATTR_CURRENT_IFSD = SCARD_ATTR_VALUE(SCARD_CLASS_IFD_PROTOCOL, 0x0208);

/** Current BWT. */
export const SCARD_ATTR_CURRENT_BWT = SCARD_ATTR_VALUE(SCARD_CLASS_IFD_PROTOCOL, 0x0209);

/** Current CWT. */
export const SCARD_ATTR_CURRENT_CWT = SCARD_ATTR_VALUE(SCARD_CLASS_IFD_PROTOCOL, 0x020a);

/** Current EBC encoding. */
export const SCARD_ATTR_CURRENT_EBC_ENCODING = SCARD_ATTR_VALUE(SCARD_CLASS_IFD_PROTOCOL, 0x020b);

/** Extended BWT. */
export const SCARD_ATTR_EXTENDED_BWT = SCARD_ATTR_VALUE(SCARD_CLASS_IFD_PROTOCOL, 0x020c);

/** ICC presence. */
export const SCARD_ATTR_ICC_PRESENCE = SCARD_ATTR_VALUE(SCARD_CLASS_ICC_STATE, 0x0300);

/** ICC interface status. */
export const SCARD_ATTR_ICC_INTERFACE_STATUS = SCARD_ATTR_VALUE(SCARD_CLASS_ICC_STATE, 0x0301);

/** Current I/O state. */
export const SCARD_ATTR_CURRENT_IO_STATE = SCARD_ATTR_VALUE(SCARD_CLASS_ICC_STATE, 0x0302);

/** ATR string. */
export const SCARD_ATTR_ATR_STRING = SCARD_ATTR_VALUE(SCARD_CLASS_ICC_STATE, 0x0303);

/** ICC type per ATR. */
export const SCARD_ATTR_ICC_TYPE_PER_ATR = SCARD_ATTR_VALUE(SCARD_CLASS_ICC_STATE, 0x0304);

/** Escape: reset. */
export const SCARD_ATTR_ESC_RESET = SCARD_ATTR_VALUE(SCARD_CLASS_VENDOR_DEFINED, 0xa000);

/** Escape: cancel. */
export const SCARD_ATTR_ESC_CANCEL = SCARD_ATTR_VALUE(SCARD_CLASS_VENDOR_DEFINED, 0xa003);

/** Escape: auth request. */
export const SCARD_ATTR_ESC_AUTHREQUEST = SCARD_ATTR_VALUE(SCARD_CLASS_VENDOR_DEFINED, 0xa005);

/** Maximum input size. */
export const SCARD_ATTR_MAXINPUT = SCARD_ATTR_VALUE(SCARD_CLASS_VENDOR_DEFINED, 0xa007);

/** Device unit. */
export const SCARD_ATTR_DEVICE_UNIT = SCARD_ATTR_VALUE(SCARD_CLASS_SYSTEM, 0x0001);

/** Device in use flag. */
export const SCARD_ATTR_DEVICE_IN_USE = SCARD_ATTR_VALUE(SCARD_CLASS_SYSTEM, 0x0002);

/** Device friendly name (ASCII). */
export const SCARD_ATTR_DEVICE_FRIENDLY_NAME_A = SCARD_ATTR_VALUE(SCARD_CLASS_SYSTEM, 0x0003);

/** Device system name (ASCII). */
export const SCARD_ATTR_DEVICE_SYSTEM_NAME_A = SCARD_ATTR_VALUE(SCARD_CLASS_SYSTEM, 0x0004);

/** Device friendly name (Unicode / wide). */
export const SCARD_ATTR_DEVICE_FRIENDLY_NAME_W = SCARD_ATTR_VALUE(SCARD_CLASS_SYSTEM, 0x0005);

/** Device system name (Unicode / wide). */
export const SCARD_ATTR_DEVICE_SYSTEM_NAME_W = SCARD_ATTR_VALUE(SCARD_CLASS_SYSTEM, 0x0006);

/** Suppress T=1 IFS request. */
export const SCARD_ATTR_SUPRESS_T1_IFS_REQUEST = SCARD_ATTR_VALUE(SCARD_CLASS_SYSTEM, 0x0007);

/** Device friendly name (defaults to ASCII variant). */
export const SCARD_ATTR_DEVICE_FRIENDLY_NAME = SCARD_ATTR_DEVICE_FRIENDLY_NAME_A;

/** Device system name (defaults to ASCII variant). */
export const SCARD_ATTR_DEVICE_SYSTEM_NAME = SCARD_ATTR_DEVICE_SYSTEM_NAME_A;
