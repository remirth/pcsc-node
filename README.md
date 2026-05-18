# pcsc

Node.js bindings to the PC/SC API for smart card communication.

A TypeScript port of the [pcsc-rust](https://github.com/bluetech/pcsc-rust) crate, using the [Node.js 26 experimental FFI](https://nodejs.org/api/ffi.html) (`node:ffi`) to call the native PC/SC C library directly — no native addons or rebuilds required.

## Packages

| Package                                     | Description                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| [`@remirth/pcsc-sys`](./packages/pcsc-sys/) | Low-level FFI bindings to the PC/SC C API (constants, types, raw function wrappers) |
| [`@remirth/pcsc`](./packages/pcsc/)         | High-level, safe, ergonomic TypeScript API                                          |

## Supported platforms

| Platform   | Backend                                                              |
| ---------- | -------------------------------------------------------------------- |
| Linux, BSD | [pcsclite](https://pcsclite.apdu.fr/) (`libpcsclite.so`) and `pcscd` |
| macOS      | Built-in `PCSC.framework`                                            |
| Windows    | Built-in `WinSCard.dll`                                              |

## Quick start

```ts
import {
  Context,
  Scope,
  ShareMode,
  Protocols,
  Error,
  MAX_BUFFER_SIZE,
} from "@remirth/pcsc";

// Establish a PC/SC context
const ctx = Context.establish(Scope.User);

// List available readers
const readers = ctx.listReadersOwned();
if (readers.length === 0) {
  console.log("No readers connected.");
  ctx.release();
  process.exit(0);
}

const reader = readers[0]!;
console.log("Using reader:", reader);

// Connect to the card
let card;
try {
  card = ctx.connect(reader, ShareMode.Shared, Protocols.ANY);
} catch (err) {
  if (err === Error.NoSmartcard) {
    console.log("No smart card present.");
    ctx.release();
    process.exit(0);
  }
  throw err;
}

// Send an APDU command
const apdu = Buffer.from([
  0x00, 0xa4, 0x04, 0x00, 0x0a, 0xa0, 0x00, 0x00, 0x00, 0x62, 0x03, 0x01, 0x0c,
  0x06, 0x01,
]);
const recvBuf = Buffer.alloc(MAX_BUFFER_SIZE);
const response = card.transmit(apdu, recvBuf);
console.log("APDU response:", response);

card.disconnect(0);
ctx.release();
```

## Run

Node.js 26 or later is required. The experimental FFI flag must be enabled:

```sh
node --experimental-ffi your-script.js
```

## API overview

### Context

```ts
const ctx = Context.establish(Scope.User);

ctx.listReadersOwned(); // string[]
ctx.listReaders(buffer); // ReaderNames (iterable)
ctx.listReadersLen(); // number
ctx.connect(reader, mode, prot); // Card
ctx.getStatusChange(timeout, states); // blocking
ctx.cancel(); // interrupt blocking call
ctx.isValid(); // throws on invalid
ctx.release(); // explicit release
```

Context implements `Symbol.dispose` for `using`:

```ts
using ctx = Context.establish(Scope.User);
// ... use ctx ...
// automatically released here
```

### Card

```ts
const card = ctx.connect(reader, ShareMode.Shared, Protocols.ANY);

card.transmit(sendBuf, recvBuf); // Buffer
card.control(code, sendBuf, recvBuf); // Buffer
card.getAttribute(attr, buf); // Buffer
card.getAttributeOwned(attr); // Buffer
card.setAttribute(attr, data);
card.status(namesBuf, atrBuf); // CardStatus
card.reconnect(mode, prot, init);
card.disconnect(Disposition.LeaveCard);

// Transaction
using tx = card.transaction();
tx.getCard().transmit(apdu, recvBuf);
// automatically ended with LeaveCard
```

Card implements `Symbol.dispose` (disconnects with `ResetCard`).

### Reader monitoring

```ts
const state = new ReaderState(readerName, State.UNAWARE);
ctx.getStatusChange(null, [state]);

if (state.eventState & State.CHANGED) {
  console.log("Reader state changed:", state.atr);
  state.syncCurrentState();
}
```

### Error handling

Errors are thrown as numeric codes matching the PC/SC error constants:

```ts
try {
  ctx.connect(reader, ShareMode.Shared, Protocols.ANY);
} catch (err) {
  if (err === Error.NoSmartcard) {
    /* ... */
  }
  if (err === Error.SharingViolation) {
    /* ... */
  }
  console.log(errorMessage(err));
}
```

## Enums and constants

| Name             | Kind                          | Description                                            |
| ---------------- | ----------------------------- | ------------------------------------------------------ |
| `Error`          | const object + type           | All PC/SC error codes (Success, Cancelled, Timeout, …) |
| `Scope`          | const object + type           | Context scope (User, Terminal, System, Global)         |
| `ShareMode`      | const object + type           | Connection sharing (Exclusive, Shared, Direct)         |
| `Disposition`    | const object + type           | Disconnect action (LeaveCard, ResetCard, …)            |
| `Protocol`       | const object + type           | Card protocol (T0, T1, RAW)                            |
| `Protocols`      | const object + type (bitmask) | Protocol mask (T0, T1, RAW, ANY)                       |
| `State`          | const object + type (bitmask) | Reader state flags (UNAWARE, CHANGED, PRESENT, …)      |
| `Status`         | const object + type (bitmask) | Card status flags (ABSENT, PRESENT, POWERED, …)        |
| `Attribute`      | const object + type           | Reader attribute IDs                                   |
| `AttributeClass` | const object + type           | Attribute category IDs                                 |

## Async wrapper

```ts
import { ContextAsync, Scope, ShareMode, Protocols } from "@remirth/pcsc";

const ctx = ContextAsync.establish(Scope.User);
const readers = await ctx.listReadersOwned();
const card = await ctx.connect(readers[0]!, ShareMode.Shared, Protocols.ANY);
const response = await card.transmit(apdu, recvBuf);
await ctx.release();
```

**Note:** Truly blocking calls (like `getStatusChange`) still block the event loop in the async variant. Offload to a worker thread for non-blocking behaviour.

## Structuring and building

This is a pnpm workspace monorepo:

```
pcsc/
├── packages/
│   ├── pcsc-sys/    @remirth/pcsc-sys
│   └── pcsc/        @remirth/pcsc (depends on pcsc-sys)
└── examples/
```

Built with TypeScript (`tsc`) using `erasableSyntaxOnly` and strict mode:

```sh
pnpm install
pnpm build        # compile both packages
pnpm typecheck    # type-check only
pnpm lint         # oxlint
pnpm format       # oxfmt
```

## Credits

This project is a TypeScript port of Ran Benita's [pcsc-rust](https://github.com/bluetech/pcsc-rust) crate, preserving the same two-package architecture and safe API design.

## License

MIT
