import { toError } from 'fp-ts/lib/Either';
import { flow } from 'fp-ts/lib/function';
import * as IOE from 'fp-ts/lib/IOEither';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import isOnline from 'is-online';

import { ERROR } from './constants';
import { spinWith } from './spinner';

export type NonNullableField<T> = { [P in keyof T]-?: NonNullableField<NonNullable<T[P]>> };
export type Result = TE.TaskEither<Error, void>;

export const checkOnline: TE.TaskEither<Error, void> = pipe(
  TE.tryCatch(() => isOnline(), toError),
  TE.chain((b) => (b ? TE.taskEither.of(undefined) : pipe(new Error(ERROR.OFFLINE), TE.left)))
);

export const getenv = (name: string): O.Option<string> => O.fromNullable(process.env[name]);

export const ioeprint = flow(spinWith, IOE.rightIO);
export const teprint = flow(spinWith, TE.rightIO);
