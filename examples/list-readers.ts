import { Context, Scope, Error } from '@remirth/pcsc';

function main(): void {
  const ctx = Context.establish(Scope.User);

  try {
    const len = ctx.listReadersLen();
    if (len === 0) {
      console.log('No readers connected.');
      return;
    }
    const buf = Buffer.alloc(len);
    const readers = ctx.listReaders(buf);
    console.log('Connected readers:');
    for (const name of readers) {
      console.log(`  ${name}`);
    }
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'message' in err) {
      console.error('Error:', (err as Error).message);
    } else {
      console.error('Unexpected error:', err);
    }
  } finally {
    ctx.release();
  }
}

main();
