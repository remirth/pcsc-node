# @remirth/pcsc

High-level, safe TypeScript bindings to the PC/SC API for smart card communication.

Wraps [`@remirth/pcsc-sys`](../pcsc-sys/) with an ergonomic API modelled after the [pcsc-rust](https://github.com/bluetech/pcsc-rust) crate. Built on the Node.js 26 experimental `node:ffi` module.

## Installation

```sh
pnpm add @remirth/pcsc
```

Requires Node.js >= 26 with the `--experimental-ffi` flag.

## Quick start

```ts
import {
  Context, Scope, ShareMode, Protocols, Error,
  MAX_BUFFER_SIZE,
} from '@remirth/pcsc';

const ctx = Context.establish(Scope.User);
const readers = ctx.listReadersOwned();
const card = ctx.connect(readers[0]!, ShareMode.Shared, Protocols.ANY);

const apdu = Buffer.from([0x00, 0xA4, 0x04, 0x00, 0x0A, 0xA0, 0x00, 0x00, 0x00, 0x62, 0x03, 0x01, 0x0C, 0x06, 0x01]);
const recv = Buffer.alloc(MAX_BUFFER_SIZE);
const response = card.transmit(apdu, recv);
console.log('Response:', response);
```

Run with:

```sh
node --experimental-ffi script.js
```

## API

### `Context`

Establishes a connection to the PC/SC service.

```ts
import { Context, Scope } from '@remirth/pcsc';

// Create a context
const ctx = Context.establish(Scope.User);

// List readers
ctx.listReadersOwned();                    // string[]
const len = ctx.listReadersLen();          // number
const buf = Buffer.alloc(len);
const names = ctx.listReaders(buf);        // ReaderNames (iterable)

// Connect to a card
const card = ctx.connect('Reader Name 0', ShareMode.Shared, Protocols.ANY);

// Blocking state monitoring
const states = [new ReaderState('Reader 0', State.UNAWARE)];
ctx.getStatusChange(5000, states);         // 5s timeout, null = infinite

// Cancel a blocking call (from another context)
ctx.cancel();

// Validate / release
ctx.isValid();
ctx.release();
```

Implements `Symbol.dispose`:

```ts
using ctx = Context.establish(Scope.User);
// automatically released at scope exit
```

### `Card`

Connection to a smart card.

```ts
// APDU transmission
const recvBuf = Buffer.alloc(MAX_BUFFER_SIZE);
const response = card.transmit(apdu, recvBuf);

// Control commands (platform-specific)
card.control(ctlCode(0x42), sendBuf, recvBuf);

// Reader attributes
const vendor = card.getAttributeOwned(Attribute.VendorName);
const len = card.getAttributeLen(Attribute.AtrString);
const buf = Buffer.alloc(len);
card.getAttribute(Attribute.AtrString, buf);
card.setAttribute(Attribute.SupressT1IfsRequest, data);

// Card status
const { namesLen, atrLen } = card.statusLen();
const namesBuf = Buffer.alloc(namesLen);
const atrBuf = Buffer.alloc(atrLen);
const status = card.status(namesBuf, atrBuf);
// status.readerNames, status.status, status.protocol, status.atr

// Reconnect / disconnect
card.reconnect(ShareMode.Exclusive, Protocols.T1, Disposition.ResetCard);
card.disconnect(Disposition.LeaveCard);
```

Implements `Symbol.dispose` (disconnects with `Disposition.ResetCard`).

### `Transaction`

Exclusive access to a card.

```ts
using tx = card.transaction();
const response = tx.getCard().transmit(apdu, recvBuf);
// transaction automatically ended with LeaveCard

// Manual control
tx.end(Disposition.LeaveCard);
tx.reconnect(ShareMode.Shared, Protocols.ANY, Disposition.ResetCard);
```

### `ReaderState`

Tracks reader and card state for `getStatusChange`.

```ts
import { ReaderState, State } from '@remirth/pcsc';

const rs = new ReaderState('Reader Name 0', State.UNAWARE);
ctx.getStatusChange(null, [rs]);

rs.name;          // string
rs.eventState;    // State (bitmask)
rs.currentState;  // State
rs.eventCount;    // number
rs.atr;           // Buffer (ATR bytes)
rs.syncCurrentState();
```

### `ReaderNames`

Iterator over NUL-separated reader name strings.

```ts
const names = ctx.listReaders(buf);
for (const name of names) { /* ... */ }
const all = names.collect(); // string[]
```

### Error handling

```ts
import { Error, errorFromRaw, errorMessage } from '@remirth/pcsc';

try {
  card.transmit(apdu, recvBuf);
} catch (err) {
  if (err === Error.NoSmartcard) { /* ... */ }
  if (err === Error.Timeout) { /* ... */ }
  console.error(errorMessage(err));
}

// Convert raw LONG to Error
const err = errorFromRaw(0x8010000C); // Error.NoSmartcard
```

### Enums and constants

```ts
Scope.User | Scope.Terminal | Scope.System | Scope.Global
ShareMode.Exclusive | ShareMode.Shared | ShareMode.Direct
Disposition.LeaveCard | Disposition.ResetCard | Disposition.UnpowerCard | Disposition.EjectCard
Protocol.T0 | Protocol.T1 | Protocol.RAW
Protocols.T0 | Protocols.T1 | Protocols.RAW | Protocols.ANY    (bitmask)
State.UNAWARE | State.CHANGED | State.PRESENT | ...            (bitmask)
Status.UNKNOWN | Status.ABSENT | Status.PRESENT | ...          (bitmask)
Attribute.VendorName | Attribute.AtrString | ...               (attribute IDs)
AttributeClass.VendorInfo | AttributeClass.Protocol | ...      (attribute categories)
```

### Async wrapper

```ts
import { ContextAsync } from '@remirth/pcsc';

const ctx = ContextAsync.establish(Scope.User);
const readers = await ctx.listReadersOwned();
const card = await ctx.connect(readers[0]!, ShareMode.Shared, Protocols.ANY);
const response = await card.transmit(apdu, recvBuf);
await ctx.release();
```

Operations are serialised through an internal mutex so concurrent calls on the same context do not interleave. **Note:** blocking calls like `getStatusChange` still block the event loop. Offload to a worker thread for non-blocking behaviour.

## Thread safety

A `Context` can be shared across threads by passing its raw handle. Create a separate `Context` per thread for concurrent operations, or use `cancel()` from one context to interrupt a blocking call on another.

When issuing multiple commands to a card, always wrap them in a `Transaction` — other processes and system services can interleave otherwise.

## License

MIT
