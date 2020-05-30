import { error, log } from 'fp-ts/lib/Console';
import * as IO from 'fp-ts/lib/IO';
import { pipe } from 'fp-ts/lib/pipeable';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';

import { stopSpinning } from './spinner';
import { Result } from './utils';

export type Command<T> = (arg: T) => Result;

const onLeft = (e: Error): T.Task<never> =>
  pipe(
    stopSpinning(),
    IO.chain(() => error(e.message)),
    IO.chain<void, never>(() => process.exit(1)),
    T.fromIO
  );

const onRight = (): T.Task<void> =>
  pipe(
    stopSpinning(),
    IO.chain(() => log('success!')),
    T.fromIO
  );

export const handle = <T>(command: Command<T>): ((arg: T) => void) => (arg: T): Promise<void> =>
  pipe(arg, command, TE.fold(onLeft, onRight))();
