import * as E from 'fp-ts/lib/Either';
import { flow } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import { DateTime } from 'luxon';
import { ElementHandle, Page } from 'puppeteer';

import { DATE_FORMAT, ERROR, SELECTOR, XPATH } from '../constants';
import { Command } from '../handle';
import { detectTimeCardPage, login } from '../login';
import { browse, BrowseFunc } from '../puppeteer';
import { teprint } from '../utils';

type PunchType = 'recorder' | 'request';
type Recorder = Extract<'recorder', PunchType>;
type Request = Extract<'request', PunchType>;

interface CommandOptions {
  readonly type: PunchType;
  readonly profile: string;
  readonly message?: string;
  readonly date?: string;
}

type RecorderOptions = Required<Pick<CommandOptions, 'type' | 'profile'>>;
type RequestOptions = Required<Omit<CommandOptions, 'date'>> & {
  readonly date: DateTime;
};

function convertOptions(type: Recorder, { profile }: CommandOptions): E.Either<never, RecorderOptions>;
function convertOptions(
  type: Request,
  { profile, message, date }: CommandOptions
): E.Either<Error, RequestOptions>;
function convertOptions(
  type: PunchType,
  { profile, message, date }: CommandOptions
): E.Either<Error, RecorderOptions | RequestOptions> {
  if (type === 'recorder') {
    return E.right({ type, profile });
  }

  if (type === 'request') {
    if (message == null) {
      return E.left(new Error(ERROR.EMPTY_MESSAGE));
    }

    const dt = date !== undefined ? DateTime.fromFormat(date, DATE_FORMAT.DEFAULT_FULL) : DateTime.local();
    if (!dt.isValid) {
      return E.left(new Error(ERROR.INVALID_DATE));
    }

    return E.right({
      type,
      profile,
      message,
      date: dt,
    });
  }

  return E.left(new Error(ERROR.INVALID_TYPE));
}

const getBrowseFunc = (options: CommandOptions): E.Either<Error, BrowseFunc> => {
  const { type } = options;

  if (type === 'recorder') {
    return pipe(
      convertOptions(type, options),
      E.chain((converted) => E.right(record(converted)))
    );
  }

  if (type === 'request') {
    return pipe(
      convertOptions(type, options),
      E.chain((converted) => E.right(request(converted)))
    );
  }

  return E.left(new Error(ERROR.INVALID_TYPE));
};

const record = ({ profile }: RecorderOptions): BrowseFunc =>
  flow(
    login(profile),
    TE.chain(() => TE.left(new Error('unimplemented')))
  );

const request = ({ profile, message, date }: RequestOptions): BrowseFunc =>
  flow(
    login(profile),
    TE.chain(gotoRequestPage(date.toFormat(DATE_FORMAT.WORKING_DATE))),
    TE.chain(requestRecording(date.toFormat(DATE_FORMAT.RECORDING_TIMESTAMP), message))
  );

export const punch: Command<CommandOptions> = (options) =>
  pipe(
    getBrowseFunc(options),
    TE.fromEither,
    TE.chain((func) => browse(func))
  );

const gotoRequestPage = (yyyymmdd: string): RTE.ReaderTaskEither<Page, Error, Page> => (page: Page) =>
  pipe(
    teprint('going to the request page'),
    TE.chain(() =>
      TE.tryCatch(
        async () => {
          const xpath = XPATH.PARENT_OF_WORKING_DATE_INPUT(yyyymmdd);
          const node = await page.waitForXPath(xpath);
          const submit: ElementHandle<HTMLInputElement> | null = await node.$(SELECTOR.INPUT_TYPE_SUBMIT);
          if (submit === null) {
            throw new Error();
          }
          await submit.evaluate((element) => element.click());
        },
        () => new Error(ERROR.GO_TO_REQUEST_PAGE)
      )
    ),
    TE.chain<Error, unknown, void>(() => teprint('loading the request page')),
    TE.chain(() =>
      TE.tryCatch(
        () =>
          Promise.all(
            [
              SELECTOR.INPUT_RECORDING_TIMESTAMP,
              SELECTOR.INPUT_REQUEST_MESSAGE,
              SELECTOR.SELECT_RECORDING_TYPE,
              SELECTOR.BUTTON_REQUEST,
            ].map((selector) => page.waitForSelector(selector))
          ),
        () => new Error(ERROR.LOAD_REQUEST_PAGE)
      )
    ),
    TE.chain(() => TE.taskEither.of(page))
  );

const RecordingType = {
  In: '1',
  Out: '2',
} as const;

type RecordingType = typeof RecordingType[keyof typeof RecordingType];

const detectRecordingType = (page: Page): TE.TaskEither<Error, RecordingType> =>
  pipe(
    TE.tryCatch(
      async () => {
        const isPunchedIn = await checkPunchedIn(page);
        const isPunchedOut = await checkPunchedOut(page);

        if (isPunchedIn) {
          if (isPunchedOut) {
            throw new Error(ERROR.ALREADY_DONE);
          }

          return RecordingType.Out;
        }
        return RecordingType.In;
      },
      (reason) => {
        if (reason instanceof Error) {
          return new Error(ERROR.DETECT_RECORDING_TYPE(reason.message));
        }
        return new Error(ERROR.UNEXPECTED(reason));
      }
    )
  );

const checkPunchedIn = async (page: Page): Promise<boolean> => {
  const handles = await Promise.all([
    page.$x(XPATH.PENDING_PUNCHING_IN),
    page.$x(XPATH.APPROVED_PUNCHING_IN),
  ]);
  return handles.flat().length > 0;
};

const checkPunchedOut = async (page: Page): Promise<boolean> => {
  const handles = await Promise.all([
    page.$x(XPATH.PENDING_PUNCHING_OUT),
    page.$x(XPATH.APPROVED_PUNCHING_OUT),
  ]);
  return handles.flat().length > 0;
};

const inputTimestamp = (hhmm: string): RTE.ReaderTaskEither<Page, Error, void> => (page: Page) =>
  TE.tryCatch(
    async () => {
      await page.type(SELECTOR.INPUT_RECORDING_TIMESTAMP, hhmm, { delay: 200 });
      await page.waitFor(200);
      await page.$eval(SELECTOR.INPUT_RECORDING_TIMESTAMP, (element) => (element as HTMLInputElement).blur());
      await page.waitFor(200);

      await Promise.all([
        page.waitForXPath(XPATH.RECORDING_TIMESTAMP_HOUR(hhmm.substr(0, 2))),
        page.waitForXPath(XPATH.RECORDING_TIMESTAMP_MINUTE(hhmm.substr(2, 2))),
      ]);
    },
    () => new Error(ERROR.INPUT_RECORDING_TIMESTAMP)
  );

const requestRecording = (hhmm: string, message: string): RTE.ReaderTaskEither<Page, Error, void> => (
  page: Page
) =>
  pipe(
    teprint('requesting to record'),
    TE.chain(() => detectRecordingType(page)),
    TE.chain((type) =>
      pipe(
        inputTimestamp(hhmm)(page),
        TE.chain(() =>
          TE.tryCatch(
            async () => {
              await page.type(SELECTOR.INPUT_REQUEST_MESSAGE, message, { delay: 200 });
              await page.select(SELECTOR.SELECT_RECORDING_TYPE, type);
              await page.click(SELECTOR.BUTTON_REQUEST);
            },
            () => new Error(ERROR.TRY_TO_REQUEST_RECORDING)
          )
        ),
        TE.chain<Error, unknown, void>(() => teprint('be checking to see if the request has been success')),
        TE.chain(() =>
          TE.tryCatch(
            () => Promise.race([detectRequestFailure(page), detectTimeCardPage(page)]),
            (reason) => {
              if (reason instanceof Error) {
                return new Error(ERROR.REQUEST_RECORDING(reason.message));
              }
              return new Error(ERROR.UNEXPECTED(reason));
            }
          )
        )
      )
    )
  );

const detectRequestFailure = async (page: Page): Promise<void> => {
  try {
    const handle = await page.waitForSelector(SELECTOR.REQUEST_ERROR_MESSAGE);
    const reason = await handle.evaluate((element) => element.textContent);
    return Promise.reject(reason);
  } catch (e) {
    return Promise.reject(e);
  }
};
