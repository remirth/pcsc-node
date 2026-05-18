declare module 'node:ffi' {
  export type FFIType =
    | 'void'
    | 'i8' | 'int8'
    | 'u8' | 'uint8' | 'bool' | 'char'
    | 'i16' | 'int16'
    | 'u16' | 'uint16'
    | 'i32' | 'int32'
    | 'u32' | 'uint32'
    | 'i64' | 'int64'
    | 'u64' | 'uint64'
    | 'f32' | 'float'
    | 'f64' | 'double'
    | 'pointer' | 'ptr'
    | 'string' | 'str'
    | 'buffer'
    | 'arraybuffer'
    | 'function';

  export interface Signature {
    result?: string;
    return?: string;
    returns?: string;
    parameters?: string[];
    arguments?: string[];
  }

  export interface FunctionDefinitions {
    [name: string]: Signature;
  }

  export class DynamicLibrary {
    constructor(path: string | null);
    readonly path: string;
    readonly functions: Record<string, (...args: unknown[]) => unknown>;
    readonly symbols: Record<string, bigint>;
    close(): void;
    [Symbol.dispose](): void;
    getFunction(name: string, signature: Signature): (...args: unknown[]) => unknown;
    getFunctions(definitions?: FunctionDefinitions): Record<string, (...args: unknown[]) => unknown>;
    getSymbol(name: string): bigint;
    getSymbols(): Record<string, bigint>;
    registerCallback(signature: Signature, callback: (...args: unknown[]) => unknown): bigint;
    registerCallback(callback: (...args: unknown[]) => unknown): bigint;
    unregisterCallback(pointer: bigint): void;
    refCallback(pointer: bigint): void;
    unrefCallback(pointer: bigint): void;
  }

  export interface DlopenResult {
    lib: DynamicLibrary;
    functions: Record<string, (...args: unknown[]) => unknown>;
    [Symbol.dispose](): void;
  }

  export function dlopen(path: string | null, definitions?: FunctionDefinitions): DlopenResult;
  export function dlclose(handle: DynamicLibrary): void;
  export function dlsym(handle: DynamicLibrary, symbol: string): bigint;

  export const suffix: string;

  export const types: {
    VOID: FFIType;
    POINTER: FFIType;
    BUFFER: FFIType;
    ARRAY_BUFFER: FFIType;
    FUNCTION: FFIType;
    BOOL: FFIType;
    CHAR: FFIType;
    STRING: FFIType;
    FLOAT: FFIType;
    DOUBLE: FFIType;
    INT_8: FFIType;
    UINT_8: FFIType;
    INT_16: FFIType;
    UINT_16: FFIType;
    INT_32: FFIType;
    UINT_32: FFIType;
    INT_64: FFIType;
    UINT_64: FFIType;
    FLOAT_32: FFIType;
    FLOAT_64: FFIType;
  };

  export function getInt8(pointer: bigint, offset?: number): number;
  export function getUint8(pointer: bigint, offset?: number): number;
  export function getInt16(pointer: bigint, offset?: number): number;
  export function getUint16(pointer: bigint, offset?: number): number;
  export function getInt32(pointer: bigint, offset?: number): number;
  export function getUint32(pointer: bigint, offset?: number): number;
  export function getInt64(pointer: bigint, offset?: number): bigint;
  export function getUint64(pointer: bigint, offset?: number): bigint;
  export function getFloat32(pointer: bigint, offset?: number): number;
  export function getFloat64(pointer: bigint, offset?: number): number;
  export function setInt8(pointer: bigint, offset: number, value: number): void;
  export function setUint8(pointer: bigint, offset: number, value: number): void;
  export function setInt16(pointer: bigint, offset: number, value: number): void;
  export function setUint16(pointer: bigint, offset: number, value: number): void;
  export function setInt32(pointer: bigint, offset: number, value: number): void;
  export function setUint32(pointer: bigint, offset: number, value: number): void;
  export function setInt64(pointer: bigint, offset: number, value: bigint): void;
  export function setUint64(pointer: bigint, offset: number, value: bigint): void;
  export function setFloat32(pointer: bigint, offset: number, value: number): void;
  export function setFloat64(pointer: bigint, offset: number, value: number): void;

  export function toString(pointer: bigint): string | null;
  export function toBuffer(pointer: bigint, length: number, copy?: boolean): Buffer;
  export function toArrayBuffer(pointer: bigint, length: number, copy?: boolean): ArrayBuffer;
  export function exportString(string: string, pointer: bigint, length: number, encoding?: string): void;
  export function exportBuffer(buffer: Buffer, pointer: bigint, length: number): void;
  export function exportArrayBuffer(arrayBuffer: ArrayBuffer, pointer: bigint, length: number): void;
  export function exportArrayBufferView(arrayBufferView: ArrayBufferView, pointer: bigint, length: number): void;
  export function getRawPointer(source: Buffer | ArrayBuffer): bigint;
}
