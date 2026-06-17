const { buildDefinitions, getLibraryName } = require('./shared.js') as typeof import('./shared.js');

type PcscBackend = import('../backend.js').PcscBackend;
type SCardFunctions = import('../backend.js').SCardFunctions;

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
    definitions: Record<string, { parameters: NodeFfiType[]; result: NodeFfiType }>,
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

function createNodeFfiBackend(): PcscBackend {
  const ffi = require('node:ffi') as NodeFfiModule;

  const library = new ffi.DynamicLibrary(getLibraryName(ffi.suffix));
  const functions = library.getFunctions(
    buildDefinitions() as Record<string, { parameters: NodeFfiType[]; result: NodeFfiType }>,
  ) as unknown as SCardFunctions;

  return {
    name: 'node-ffi',
    raw: () => functions,
    resolveSymbol: (name: string) => library.getSymbol(name),
    getRawPointer: ffi.getRawPointer,
    toString: ffi.toString,
    toBuffer: ffi.toBuffer,
  };
}

module.exports = { createNodeFfiBackend };
