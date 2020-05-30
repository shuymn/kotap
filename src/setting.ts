import * as IO from 'fp-ts/lib/IO';
import * as IOE from 'fp-ts/lib/IOEither';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as fs from 'fs';
import os from 'os';
import path from 'path';
import stripBom from 'strip-bom';

import { ENV, ERROR, PROJECT_NAME } from './constants';
import { getenv, NonNullableField } from './utils';

interface Settingfile {
  read: <T = Record<string, unknown>>() => IOE.IOEither<Error, T>;
}

const getSettingDir: IO.IO<string> = pipe(
  getenv(ENV.KOTAP_CONFIG_DIR),
  O.getOrElse(() =>
    pipe(
      getenv(ENV.XDG_CONFIG_HOME),
      O.map((dir) => path.join(dir, PROJECT_NAME)),
      O.getOrElse(() => path.join(os.homedir(), `.${PROJECT_NAME}`))
    )
  ),
  IO.of
);

const settingf = (name: string): IO.IO<Settingfile> =>
  pipe(
    getSettingDir,
    IO.chain((dir) => pipe(path.join(dir, name), IO.io.of)),
    IO.chain((fullpath) =>
      IO.io.of({
        read: () =>
          pipe(
            IOE.tryCatch(
              () => fs.readFileSync(fullpath, { encoding: 'utf-8' }),
              () => new Error(ERROR.NO_CREDENTIALS_FILE(fullpath))
            ),
            IOE.chain((content) =>
              IOE.tryCatch(
                () => JSON.parse(stripBom(content)),
                () => new Error(ERROR.INVALID_JSON(fullpath))
              )
            )
          ),
      })
    )
  );

const SETTING = {
  CREDENTIALS: {
    NAME: 'credentials.json',
  },
};

export const settingfile = {
  credentials: settingf(SETTING.CREDENTIALS.NAME),
};

export type Credential = NonNullableField<RawCredential>;

interface RawCredential {
  type: 's2' | 's3' | undefined;
  id: string | undefined;
  password: string | undefined;
}

interface RawCredentials {
  [profile: string]: RawCredential | undefined;
}

export const getCredential = (profile: string): IOE.IOEither<Error, Credential> => {
  return pipe(
    // TODO JSONファイルのバリデーションをちゃんとやる
    settingfile.credentials().read<RawCredentials>(),
    IOE.chain((creds) =>
      pipe(
        O.fromNullable(creds[profile]),
        IOE.fromOption(() => new Error(ERROR.NO_CREDENTIAL_PROFILE(profile)))
      )
    ),
    IOE.chain((cred) => {
      const { type, id, password } = cred;
      if (type != undefined && id != undefined && password != undefined) {
        return IOE.right(cred as Credential);
      }
      return IOE.left(new Error(ERROR.INVALID_CREDENTIAL(profile)));
    })
  );
};
