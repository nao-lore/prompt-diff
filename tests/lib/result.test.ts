import { describe, expect, it } from 'vitest';
import {
  err,
  isErr,
  isOk,
  map,
  mapErr,
  ok,
  tryCatch,
  tryCatchAsync,
  unwrap,
  type Result,
} from '@/lib/result';

describe('Result', () => {
  describe('ok / err / type guards', () => {
    it('constructs an Ok value', () => {
      const result = ok(42);
      expect(result).toEqual({ ok: true, value: 42 });
      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);
    });

    it('constructs an Err value', () => {
      const error = new Error('boom');
      const result = err(error);
      expect(result).toEqual({ ok: false, error });
      expect(isErr(result)).toBe(true);
      expect(isOk(result)).toBe(false);
    });

    it('narrows the type via isOk', () => {
      const result: Result<number, string> = ok(1);
      if (isOk(result)) {
        const n: number = result.value;
        expect(n).toBe(1);
      }
    });
  });

  describe('tryCatch', () => {
    it('returns Ok on success', () => {
      const result = tryCatch(() => 'hello');
      expect(result).toEqual({ ok: true, value: 'hello' });
    });

    it('returns Err on thrown Error', () => {
      const result = tryCatch(() => {
        throw new Error('nope');
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toBe('nope');
    });

    it('wraps non-Error throws', () => {
      const result = tryCatch(() => {
        throw 'string error';
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toBe('string error');
    });

    it('wraps object throws as JSON', () => {
      const result = tryCatch(() => {
        throw { code: 500 };
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toBe('{"code":500}');
    });
  });

  describe('tryCatchAsync', () => {
    it('returns Ok on resolved promise', async () => {
      const result = await tryCatchAsync(async () => 7);
      expect(result).toEqual({ ok: true, value: 7 });
    });

    it('returns Err on rejected promise', async () => {
      const result = await tryCatchAsync(async () => {
        throw new Error('async boom');
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toBe('async boom');
    });
  });

  describe('map / mapErr', () => {
    it('maps over Ok', () => {
      const result = map(ok(2), (n) => n * 3);
      expect(result).toEqual({ ok: true, value: 6 });
    });

    it('passes Err through map unchanged', () => {
      const error = new Error('x');
      const result = map(err(error), (n: number) => n * 3);
      expect(result).toEqual({ ok: false, error });
    });

    it('maps over Err', () => {
      const result = mapErr(err('original'), (e) => `wrapped: ${e}`);
      expect(result).toEqual({ ok: false, error: 'wrapped: original' });
    });

    it('passes Ok through mapErr unchanged', () => {
      const result = mapErr(ok(5), (e: string) => e.toUpperCase());
      expect(result).toEqual({ ok: true, value: 5 });
    });
  });

  describe('unwrap', () => {
    it('returns the value for Ok', () => {
      expect(unwrap(ok('val'))).toBe('val');
    });

    it('throws the error for Err', () => {
      const error = new Error('unwrap fail');
      expect(() => unwrap(err(error))).toThrow('unwrap fail');
    });

    it('throws non-Error errors as Error', () => {
      expect(() => unwrap(err('string'))).toThrow('string');
    });
  });
});
