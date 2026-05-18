# @remirth/pcsc-sys

Low-level FFI bindings to the PC/SC C API for Node.js.

This package directly wraps the native PC/SC library (`libpcsclite`, `PCSC.framework`, `WinSCard.dll`) using the Node.js 26 experimental `node:ffi` module. It exports raw C constants, platform-specific types, and typed function wrappers. Most users should use [`@remirth/pcsc`](../pcsc/) instead, which provides a safe, high-level API on top of this package.

## Installation

```sh
pnpm add @remirth/pcsc-sys
```

Requires Node.js >= 26 with the `--experimental-ffi` flag.

## Platform detection

The library is loaded automatically at runtime based on the host platform:

| Platform | Library |
|---|---|
| Linux / BSD | `libpcsclite.so` |
| macOS | `/System/Library/Frameworks/PCSC.framework/PCSC` |
| Windows | `WinSCard.dll` |

On Linux you can override the library name and search path via environment variables:

- `PCSC_LIB_NAME` — library name (default: `libpcsclite.so`)
- `PCSC_LIB_DIR` — directory to search in

## API

### Raw function wrappers

```ts
import { raw } from '@remirth/pcsc-sys';

const fn = raw();

// Returns LONG (i32)
fn.SCardEstablishContext(scope, null, null, phCtxBuf);
fn.SCardListReaders(ctx, null, readerBuf, lenBuf);
fn.SCardConnect(ctx, reader, shareMode, protocols, cardBuf, protoBuf);
fn.SCardTransmit(card, pciPtr, sendBuf, sendLen, null, recvBuf, recvLen);
// ... all 17 PC/SC functions
```

Each function returns the raw `LONG` status code. Use `SCARD_S_SUCCESS` to check for success.

### Library handle

```ts
import { getLibrary, resolveSymbol } from '@remirth/pcsc-sys';

const lib = getLibrary();
const addr = resolveSymbol('SCardTransmit'); // bigint
```

### PCI descriptors

```ts
import { getT0Pci, getT1Pci, getRawPci } from '@remirth/pcsc-sys';

const t0 = getT0Pci();   // bigint — address of g_rgSCardT0Pci
const t1 = getT1Pci();   // bigint — address of g_rgSCardT1Pci
const raw = getRawPci(); // bigint — address of g_rgSCardRawPci
```

### Memory helpers

```ts
import { toString, toBuffer, getRawPointer } from '@remirth/pcsc-sys';

const str = toString(ptr);        // read NUL-terminated UTF-8
const buf = toBuffer(ptr, len);   // copy native memory to Buffer
const raw = getRawPointer(buf);   // get raw pointer from Buffer
```

### Types

```ts
import type { DWORD, LONG, RawContext, RawCard } from '@remirth/pcsc-sys';

// DWORD  — u32 (matches uint32_t)
// LONG   — i32 (matches int32_t)
// RawContext — number | bigint (i32 on Unix, pointer-sized on Windows)
// RawCard   — number | bigint
//
// Platform helpers:
// isWindows — boolean
// SCARDCONTEXT_TYPE — 'i32' | 'pointer'
// SCARDHANDLE_TYPE  — 'i32' | 'pointer'
// SCARD_PROTOCOL_RAW — 0x0004 | 0x0001_0000
// scardCtlCode(code) — platform-appropriate control code
```

### Constants

All PC/SC constants mirroring the C headers:

```ts
import {
  SCARD_S_SUCCESS,
  SCARD_E_TIMEOUT,
  SCARD_E_NO_SMARTCARD,
  SCARD_SCOPE_USER,
  SCARD_SHARE_SHARED,
  SCARD_PROTOCOL_T0,
  SCARD_PROTOCOL_T1,
  SCARD_PROTOCOL_ANY,
  SCARD_STATE_UNAWARE,
  SCARD_STATE_CHANGED,
  SCARD_STATE_PRESENT,
  MAX_ATR_SIZE,
  MAX_BUFFER_SIZE,
  SCARD_ATTR_VENDOR_NAME,
  SCARD_ATTR_ATR_STRING,
  // ... 100+ constants
} from '@remirth/pcsc-sys';
```

Constants are also grouped under the `ffi` namespace:

```ts
import { ffi } from '@remirth/pcsc-sys';
ffi.SCARD_S_SUCCESS; // 0
```

## License

MIT
