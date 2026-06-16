import { Context, ReaderState, Scope, Error, State, PNP_NOTIFICATION } from '@remirth/pcsc';

interface PollChange {
  reader: string;
  eventState: number;
  atr: Buffer;
}

function* poll(
  ctx: Context,
  readers: ReaderState[],
  signal: AbortSignal,
  timeout = 500,
): Generator<PollChange> {
  while (!signal.aborted) {
    try {
      ctx.getStatusChange(timeout, readers);
    } catch (err: unknown) {
      if (err === Error.Timeout) {
        continue;
      }
      if (err === Error.Cancelled) {
        return;
      }
      throw err;
    }

    for (const rs of readers) {
      const eventState = rs.eventState;
      if ((eventState & State.CHANGED) === 0) continue;

      yield {
        reader: rs.name,
        eventState,
        atr: rs.atr,
      };

      rs.syncCurrentState();
    }
  }
}

function main(): void {
  using ctx = Context.establish(Scope.User);

  const readersLen = ctx.listReadersLen();
  let readerStates: ReaderState[];

  if (readersLen > 0) {
    const buf = Buffer.alloc(readersLen);
    const readers = ctx.listReaders(buf);
    readerStates = [...readers].map((name) => new ReaderState(name, State.UNAWARE));
  } else {
    readerStates = [];
  }

  readerStates.push(new ReaderState(PNP_NOTIFICATION, State.UNAWARE));

  const abortController = new AbortController();

  setTimeout(() => {
    console.log('30 seconds elapsed, stopping...');
    abortController.abort();
  }, 30_000);

  console.log('Polling smart card events every 500ms for 30 seconds. Press Ctrl+C to exit.');

  for (const change of poll(ctx, readerStates, abortController.signal)) {
    console.log(`Reader: ${change.reader}`);
    console.log(`  Event state: 0x${change.eventState.toString(16)}`);

    if (change.atr.length > 0) {
      console.log(`  ATR: ${change.atr.toString('hex')}`);
    }
  }
}

main();
