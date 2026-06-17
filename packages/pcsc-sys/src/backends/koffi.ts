import { createRequire } from 'node:module';

import type { PcscBackend, SCardFunctions } from '../backend.ts';
import { buildDefinitions, getLibraryNames } from './shared.ts';

interface KoffiLib {
  func(signature: string): (...args: unknown[]) => unknown;
  symbol(name: string, type?: string): bigint;
}

interface KoffiModule {
  extension?: string;
  load(path: string): KoffiLib;
  view(pointer: bigint, length: number): ArrayBuffer;
  address(value: Buffer | ArrayBuffer): bigint;
}

export function createKoffiBackend(): PcscBackend {
  const require = createRequire(import.meta.url);
  const koffi = require('koffi') as KoffiModule;

  const definitions = buildDefinitions();
  const { lib, functions } = loadLibrary(koffi, definitions);

  return {
    name: 'koffi',
    raw: () => functions,
    resolveSymbol: (name: string) => resolveSymbol(lib, name),
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

function resolveSymbol(lib: KoffiLib, name: string): bigint {
  try {
    return lib.symbol(name);
  } catch {
    // Koffi 2.x accepted a second type argument for symbol lookup and some
    // builds still appear to require the 2-argument form.
    return lib.symbol(name, 'void *');
  }
}

function loadLibrary(
  koffi: KoffiModule,
  definitions: ReturnType<typeof buildDefinitions>,
): { lib: KoffiLib; functions: SCardFunctions } {
  const errors: Error[] = [];

  for (const libraryName of getLibraryNames(koffi.extension ?? 'so')) {
    try {
      const lib = koffi.load(libraryName);
      const functions = Object.fromEntries(
        Object.entries(definitions).map(([name, def]) => [name, lib.func(toPrototype(def.symbol, def))]),
      ) as unknown as SCardFunctions;
      return { lib, functions };
    } catch (error) {
      errors.push(error as Error);
    }
  }

  throw new AggregateError(errors, 'Failed to load PC/SC library with koffi');
}

function toPrototype(
  name: string,
  definition: { parameters: string[]; result: string },
): string {
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
