/**
 * PC/SC API enumerations, bitmask constants, and helper functions.
 *
 * @module
 */

import * as ffi from '@remirth/pcsc-sys';

/* ------------------------------------------------------------------ */
/*  Scope                                                             */
/* ------------------------------------------------------------------ */

/** Context scope passed to {@link Context.establish}. */
export const Scope = {
  /** User context (most common). */
  User: ffi.SCARD_SCOPE_USER,
  /** Terminal context. */
  Terminal: ffi.SCARD_SCOPE_TERMINAL,
  /** System context. */
  System: ffi.SCARD_SCOPE_SYSTEM,
  /** Global context. */
  Global: ffi.SCARD_SCOPE_GLOBAL,
} as const;
export type Scope = (typeof Scope)[keyof typeof Scope];

/* ------------------------------------------------------------------ */
/*  Share modes                                                       */
/* ------------------------------------------------------------------ */

/** How a reader connection is shared. */
export const ShareMode = {
  /** Exclusive connection — no other connections allowed. */
  Exclusive: ffi.SCARD_SHARE_EXCLUSIVE,
  /** Shared connection — other shared connections allowed. */
  Shared: ffi.SCARD_SHARE_SHARED,
  /** Direct connection — no protocol negotiation. */
  Direct: ffi.SCARD_SHARE_DIRECT,
} as const;
export type ShareMode = (typeof ShareMode)[keyof typeof ShareMode];

/* ------------------------------------------------------------------ */
/*  Disposition                                                       */
/* ------------------------------------------------------------------ */

/** Action to take when disconnecting from a card. */
export const Disposition = {
  /** Leave the card as-is. */
  LeaveCard: ffi.SCARD_LEAVE_CARD,
  /** Reset the card. */
  ResetCard: ffi.SCARD_RESET_CARD,
  /** Unpower the card. */
  UnpowerCard: ffi.SCARD_UNPOWER_CARD,
  /** Eject the card. */
  EjectCard: ffi.SCARD_EJECT_CARD,
} as const;
export type Disposition = (typeof Disposition)[keyof typeof Disposition];

/* ------------------------------------------------------------------ */
/*  Protocol                                                          */
/* ------------------------------------------------------------------ */

/** A smart card communication protocol. */
export const Protocol = {
  /** T=0 (byte-oriented) protocol. */
  T0: ffi.SCARD_PROTOCOL_T0,
  /** T=1 (block-oriented) protocol. */
  T1: ffi.SCARD_PROTOCOL_T1,
  /** Raw protocol (no TPDU layer). */
  RAW: ffi.SCARD_PROTOCOL_RAW,
} as const;
export type Protocol = (typeof Protocol)[keyof typeof Protocol];

/* ------------------------------------------------------------------ */
/*  Protocols (bitmask)                                               */
/* ------------------------------------------------------------------ */

/**
 * Bitmask of possible communication protocols.
 *
 * Combine with bitwise OR: `Protocols.T0 | Protocols.T1`.
 * Use `Protocols.ANY` as a shorthand for T0|T1.
 */
export const Protocols = {
  UNDEFINED: ffi.SCARD_PROTOCOL_UNDEFINED,
  T0: ffi.SCARD_PROTOCOL_T0,
  T1: ffi.SCARD_PROTOCOL_T1,
  RAW: ffi.SCARD_PROTOCOL_RAW,
  ANY: ffi.SCARD_PROTOCOL_ANY,
} as const;
export type Protocols = number;

/* ------------------------------------------------------------------ */
/*  State (bitmask) — reader / event states                           */
/* ------------------------------------------------------------------ */

/**
 * Bitmask of card reader states.
 *
 * These are used with {@link ReaderState} to track reader status
 * and with {@link Context.getStatusChange} to detect state transitions.
 */
export const State = {
  UNAWARE: ffi.SCARD_STATE_UNAWARE,
  IGNORE: ffi.SCARD_STATE_IGNORE,
  CHANGED: ffi.SCARD_STATE_CHANGED,
  UNKNOWN: ffi.SCARD_STATE_UNKNOWN,
  UNAVAILABLE: ffi.SCARD_STATE_UNAVAILABLE,
  EMPTY: ffi.SCARD_STATE_EMPTY,
  PRESENT: ffi.SCARD_STATE_PRESENT,
  ATRMATCH: ffi.SCARD_STATE_ATRMATCH,
  EXCLUSIVE: ffi.SCARD_STATE_EXCLUSIVE,
  INUSE: ffi.SCARD_STATE_INUSE,
  MUTE: ffi.SCARD_STATE_MUTE,
  UNPOWERED: ffi.SCARD_STATE_UNPOWERED,
} as const;
export type State = number;

/* ------------------------------------------------------------------ */
/*  Status (bitmask) — card insert/removal states                      */
/* ------------------------------------------------------------------ */

/**
 * Bitmask of smart card status in a reader.
 *
 * Unlike the raw PC/SC constants, these use the same bit values
 * across all platforms.
 */
export const Status = {
  UNKNOWN: 0x0001,
  ABSENT: 0x0002,
  PRESENT: 0x0004,
  SWALLOWED: 0x0008,
  POWERED: 0x0010,
  NEGOTIABLE: 0x0020,
  SPECIFIC: 0x0040,
} as const;
export type Status = number;

/* ------------------------------------------------------------------ */
/*  Attribute classes                                                 */
/* ------------------------------------------------------------------ */

/** Category of a reader or card attribute. */
export const AttributeClass = {
  VendorInfo: ffi.SCARD_CLASS_VENDOR_INFO,
  Communications: ffi.SCARD_CLASS_COMMUNICATIONS,
  Protocol: ffi.SCARD_CLASS_PROTOCOL,
  PowerMgmt: ffi.SCARD_CLASS_POWER_MGMT,
  Security: ffi.SCARD_CLASS_SECURITY,
  Mechanical: ffi.SCARD_CLASS_MECHANICAL,
  VendorDefined: ffi.SCARD_CLASS_VENDOR_DEFINED,
  IfdProtocol: ffi.SCARD_CLASS_IFD_PROTOCOL,
  IccState: ffi.SCARD_CLASS_ICC_STATE,
  System: ffi.SCARD_CLASS_SYSTEM,
} as const;
export type AttributeClass = (typeof AttributeClass)[keyof typeof AttributeClass];

/* ------------------------------------------------------------------ */
/*  Attribute IDs                                                     */
/* ------------------------------------------------------------------ */

/**
 * Card reader attribute identifiers.
 *
 * Passed to {@link Card.getAttribute} / {@link Card.setAttribute}.
 */
export const Attribute = {
  VendorName: ffi.SCARD_ATTR_VENDOR_NAME,
  VendorIfdType: ffi.SCARD_ATTR_VENDOR_IFD_TYPE,
  VendorIfdVersion: ffi.SCARD_ATTR_VENDOR_IFD_VERSION,
  VendorIfdSerialNo: ffi.SCARD_ATTR_VENDOR_IFD_SERIAL_NO,
  ChannelId: ffi.SCARD_ATTR_CHANNEL_ID,
  AsyncProtocolTypes: ffi.SCARD_ATTR_ASYNC_PROTOCOL_TYPES,
  DefaultClk: ffi.SCARD_ATTR_DEFAULT_CLK,
  MaxClk: ffi.SCARD_ATTR_MAX_CLK,
  DefaultDataRate: ffi.SCARD_ATTR_DEFAULT_DATA_RATE,
  MaxDataRate: ffi.SCARD_ATTR_MAX_DATA_RATE,
  MaxIfsd: ffi.SCARD_ATTR_MAX_IFSD,
  SyncProtocolTypes: ffi.SCARD_ATTR_SYNC_PROTOCOL_TYPES,
  PowerMgmtSupport: ffi.SCARD_ATTR_POWER_MGMT_SUPPORT,
  UserToCardAuthDevice: ffi.SCARD_ATTR_USER_TO_CARD_AUTH_DEVICE,
  UserAuthInputDevice: ffi.SCARD_ATTR_USER_AUTH_INPUT_DEVICE,
  Characteristics: ffi.SCARD_ATTR_CHARACTERISTICS,
  CurrentProtocolType: ffi.SCARD_ATTR_CURRENT_PROTOCOL_TYPE,
  CurrentClk: ffi.SCARD_ATTR_CURRENT_CLK,
  CurrentF: ffi.SCARD_ATTR_CURRENT_F,
  CurrentD: ffi.SCARD_ATTR_CURRENT_D,
  CurrentN: ffi.SCARD_ATTR_CURRENT_N,
  CurrentW: ffi.SCARD_ATTR_CURRENT_W,
  CurrentIfsc: ffi.SCARD_ATTR_CURRENT_IFSC,
  CurrentIfsd: ffi.SCARD_ATTR_CURRENT_IFSD,
  CurrentBwt: ffi.SCARD_ATTR_CURRENT_BWT,
  CurrentCwt: ffi.SCARD_ATTR_CURRENT_CWT,
  CurrentEbcEncoding: ffi.SCARD_ATTR_CURRENT_EBC_ENCODING,
  ExtendedBwt: ffi.SCARD_ATTR_EXTENDED_BWT,
  IccPresence: ffi.SCARD_ATTR_ICC_PRESENCE,
  IccInterfaceStatus: ffi.SCARD_ATTR_ICC_INTERFACE_STATUS,
  CurrentIoState: ffi.SCARD_ATTR_CURRENT_IO_STATE,
  AtrString: ffi.SCARD_ATTR_ATR_STRING,
  IccTypePerAtr: ffi.SCARD_ATTR_ICC_TYPE_PER_ATR,
  EscReset: ffi.SCARD_ATTR_ESC_RESET,
  EscCancel: ffi.SCARD_ATTR_ESC_CANCEL,
  EscAuthrequest: ffi.SCARD_ATTR_ESC_AUTHREQUEST,
  Maxinput: ffi.SCARD_ATTR_MAXINPUT,
  DeviceUnit: ffi.SCARD_ATTR_DEVICE_UNIT,
  DeviceInUse: ffi.SCARD_ATTR_DEVICE_IN_USE,
  DeviceFriendlyName: ffi.SCARD_ATTR_DEVICE_FRIENDLY_NAME,
  DeviceSystemName: ffi.SCARD_ATTR_DEVICE_SYSTEM_NAME,
  SupressT1IfsRequest: ffi.SCARD_ATTR_SUPRESS_T1_IFS_REQUEST,
} as const;
export type Attribute = (typeof Attribute)[keyof typeof Attribute];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/**
 * Convert a raw protocol `DWORD` to a {@link Protocol} value.
 *
 * Returns `undefined` for `SCARD_PROTOCOL_UNDEFINED` (no active protocol)
 * and unknown values.
 *
 * @param raw - Raw `DWORD` from the C API.
 */
export function protocolFromRaw(raw: number): Protocol | undefined {
  switch (raw) {
    case ffi.SCARD_PROTOCOL_UNDEFINED:
      return undefined;
    case ffi.SCARD_PROTOCOL_T0:
      return Protocol.T0;
    case ffi.SCARD_PROTOCOL_T1:
      return Protocol.T1;
    case ffi.SCARD_PROTOCOL_RAW:
      return Protocol.RAW;
    default:
      return undefined;
  }
}

/**
 * Test whether a bitmask value contains a specific flag.
 *
 * @param flags - The combined bitmask value.
 * @param flag - The single flag to test.
 */
export function hasFlag(flags: number, flag: number): boolean {
  return (flags & flag) !== 0;
}
