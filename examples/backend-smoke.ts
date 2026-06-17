import { getBackendInfo } from '@remirth/pcsc-sys';
import { Context, Scope, isPCSCError } from '@remirth/pcsc';

function main(): void {
  try {
    const backend = getBackendInfo();
    console.log('Backend:', backend.selected);
    console.log('Mode:', backend.mode);
    console.log('node:ffi available:', backend.nodeFfiAvailable);
    console.log('koffi available:', backend.koffiAvailable);

    using ctx = Context.establish(Scope.User);
    const readerLen = ctx.listReadersLen();
    console.log('Reader list buffer length:', readerLen);
  } catch (error) {
    if (isPCSCError(error)) {
      console.error(`PC/SC error: 0x${error.code.toString(16)} (${error.message})`);
      process.exitCode = 1;
      return;
    }

    throw error;
  }
}

main();
