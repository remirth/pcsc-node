import { Context, Scope, Error, State, ReaderState, PNP_NOTIFICATION } from '@remirth/pcsc';

function main(): void {
  const ctx = Context.establish(Scope.User);

  try {
    console.log('Entering blocking call; it will timeout in 60 seconds.');
    const readerStates = [new ReaderState(PNP_NOTIFICATION(), State.UNAWARE)];

    try {
      ctx.getStatusChange(60000, readerStates);
      console.log('Blocking call exited normally.');
    } catch (err: unknown) {
      if (err === Error.Cancelled) {
        console.log('Blocking call was cancelled.');
      } else if (err === Error.Timeout) {
        console.log('Blocking call timed out.');
      } else {
        throw err;
      }
    }
  } finally {
    ctx.release();
  }
}

main();
