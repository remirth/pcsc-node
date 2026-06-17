import { createRequire } from 'node:module';

import type { PcscBackend, SCardFunctions } from '../backend.js';
import { buildDefinitions, getLibraryNames } from './shared.js';

type NodeFfiType =
  | 'void'
  | 'i8'
  | 'u8'
  | 'bool'
  | 'char'
  | 'i16'
  | 'u16'
  | 'i32'
  | 'u32'
  | 'i64'
  | 'u64'
  | 'f32'
  | 'f64'
  | 'pointer'
  | 'string';

interface DynamicLibrary {
  getFunctions(
    definitions: Record<string, { arguments: NodeFfiType[]; return: NodeFfiType }>,
  ): Record<string, (...args: unknown[]) => unknown>;
  getSymbol(name: string): bigint;
}

interface NodeFfiModule {
  DynamicLibrary: new (path: string | null) => DynamicLibrary;
  suffix: string;
  toString(pointer: bigint): string | null;
  toBuffer(pointer: bigint, length: number, copy?: boolean): Buffer;
  getRawPointer(source: Buffer | ArrayBuffer): bigint;
}

export function createNodeFfiBackend(): PcscBackend {
  const require = createRequire(import.meta.url);
  const ffi = require('node:ffi') as NodeFfiModule;

  const definitions = buildDefinitions();
  const { library, functions } = loadLibrary(ffi, definitions);

  return {
    name: 'node-ffi',
    raw: () => functions,
    resolveSymbol: (name: string) => library.getSymbol(name),
    getRawPointer: ffi.getRawPointer,
    toString: ffi.toString,
    toBuffer: ffi.toBuffer,
  };
}

function loadLibrary(
  ffi: NodeFfiModule,
  definitions: ReturnType<typeof buildDefinitions>,
): { library: DynamicLibrary; functions: SCardFunctions } {
  const errors: Error[] = [];

  for (const libraryName of getLibraryNames(ffi.suffix)) {
    try {
      const library = new ffi.DynamicLibrary(libraryName);
      const boundFunctions = library.getFunctions(
        Object.fromEntries(
          Object.values(definitions).map((def) => [
            def.symbol,
            {
              arguments: def.parameters as NodeFfiType[],
              return: def.result as NodeFfiType,
            },
          ]),
        ),
      );
      const functions = Object.fromEntries(
        Object.entries(definitions).map(([name, def]) => [name, boundFunctions[def.symbol]!]),
      ) as unknown as SCardFunctions;
      return { library, functions };
    } catch (error) {
      errors.push(error as Error);
    }
  }

  throw new AggregateError(errors, 'Failed to load PC/SC library with node:ffi');
}
