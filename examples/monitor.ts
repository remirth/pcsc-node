import { Context, Scope, Error, State, ReaderState } from '@remirth/pcsc';

const PNP_NOTIFICATION = '\\\\?PnP?\\Notification';

function main(): void {
  const ctx = Context.establish(Scope.User);

  try {
    const readersLen = ctx.listReadersLen();
    let readerStates: ReaderState[];

    if (readersLen > 0) {
      const buf = Buffer.alloc(readersLen);
      const readers = ctx.listReaders(buf);
      readerStates = [...readers].map(name => new ReaderState(name, State.UNAWARE));
    } else {
      readerStates = [];
    }

    readerStates.push(new ReaderState(PNP_NOTIFICATION, State.UNAWARE));

    console.log('Monitoring smart card events. Press Ctrl+C to exit.');

    for (;;) {
      try {
        ctx.getStatusChange(null, readerStates);
      } catch (err: unknown) {
        if (err === Error.Cancelled) break;
        throw err;
      }

      for (const rs of readerStates) {
        const eventState = rs.eventState;
        if ((eventState & State.CHANGED) === 0) continue;

        console.log(`Reader: ${rs.name}`);
        console.log(`  Event state: 0x${eventState.toString(16)}`);

        const atr = rs.atr;
        if (atr.length > 0) {
          console.log(`  ATR: ${atr.toString('hex')}`);
        }

        rs.syncCurrentState();
      }
    }
  } finally {
    ctx.release();
  }
}

main();
