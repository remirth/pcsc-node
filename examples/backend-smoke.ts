import { getBackendInfo } from '@remirth/pcsc-sys';
import { Context, Scope } from '@remirth/pcsc';

function main(): void {
  const backend = getBackendInfo();
  console.log('Backend:', backend.selected);
  console.log('Mode:', backend.mode);
  console.log('node:ffi available:', backend.nodeFfiAvailable);
  console.log('koffi available:', backend.koffiAvailable);

  using ctx = Context.establish(Scope.User);
  const readerLen = ctx.listReadersLen();
  console.log('Reader list buffer length:', readerLen);
}

main();
