const { buildDefinitions, getLibraryName } = require('./shared.js') as typeof import('./shared.js');

type PcscBackend = import('../backend.js').PcscBackend;
type SCardFunctions = import('../backend.js').SCardFunctions;

interface KoffiLib {
  func(signature: string): (...args: unknown[]) => unknown;
  symbol(name: string): bigint;
}

interface KoffiModule {
  extension?: string;
  load(path: string): KoffiLib;
  view(pointer: bigint, length: number): ArrayBuffer;
  address(value: Buffer | ArrayBuffer): bigint;
}

function createKoffiBackend(): PcscBackend {
  const koffi = require('koffi') as KoffiModule;

  const lib = koffi.load(getLibraryName(koffi.extension ?? 'so'));
  const definitions = buildDefinitions();
  const functions = Object.fromEntries(
    Object.entries(definitions).map(([name, def]) => [name, lib.func(toPrototype(name, def))]),
  ) as unknown as SCardFunctions;

  return {
    name: 'koffi',
    raw: () => functions,
    resolveSymbol: (name: string) => lib.symbol(name),
    getRawPointer: (source: Buffer | ArrayBuffer) => koffi.address(source),
    toString(pointer: bigint) {
      if (pointer === 0n) {
        return null;
      }
      const bytes: number[] = [];
      for (let offset = 0; ; offset++) {
        const view = new Uint8Array(koffi.view(pointer + BigInt(offset), 1));
        const value = view[0]!;
        if (value === 0) {
          return Buffer.from(bytes).toString('utf8');
        }
        bytes.push(value);
      }
    },
    toBuffer(pointer: bigint, length: number, copy = true) {
      const view = Buffer.from(koffi.view(pointer, length));
      return copy ? Buffer.from(view) : view;
    },
  };
}

function toPrototype(name: string, definition: { parameters: string[]; result: string }): string {
  const params = definition.parameters
    .map((param, index) => `${toKoffiType(param)} arg${index}`)
    .join(', ');
  return `${toKoffiType(definition.result)} ${name}(${params})`;
}

function toKoffiType(type: string): string {
  switch (type) {
    case 'u32':
      return 'uint32_t';
    case 'i32':
      return 'int32_t';
    case 'u64':
      return 'uint64_t';
    case 'i64':
      return 'int64_t';
    case 'pointer':
      return 'void *';
    case 'string':
      return 'const char *';
    default:
      return type;
  }
}

module.exports = { createKoffiBackend };
