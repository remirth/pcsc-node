import { Context, Scope, ShareMode, Protocols, Error, MAX_BUFFER_SIZE } from '@remirth/pcsc';

function main(): void {
  const ctx = Context.establish(Scope.User);

  try {
    const len = ctx.listReadersLen();
    if (len === 0) {
      console.log('No readers are connected.');
      return;
    }

    const buf = Buffer.alloc(len);
    const readers = ctx.listReaders(buf);
    const firstReader = [...readers][0];
    if (!firstReader) {
      console.log('No readers are connected.');
      return;
    }

    console.log('Using reader:', firstReader);

    let card;
    try {
      card = ctx.connect(firstReader, ShareMode.Shared, Protocols.ANY);
    } catch (err: unknown) {
      if (err === Error.NoSmartcard) {
        console.log('A smartcard is not present in the reader.');
        return;
      }
      throw err;
    }

    try {
      const apdu = Buffer.from([
        0x00, 0xA4, 0x04, 0x00, 0x0A,
        0xA0, 0x00, 0x00, 0x00, 0x62,
        0x03, 0x01, 0x0C, 0x06, 0x01,
      ]);
      console.log('Sending APDU:', apdu);
      const rapduBuf = Buffer.alloc(MAX_BUFFER_SIZE);
      const rapdu = card.transmit(apdu, rapduBuf);
      console.log('APDU response:', rapdu);
    } finally {
      card.disconnect(0);
    }
  } finally {
    ctx.release();
  }
}

main();
