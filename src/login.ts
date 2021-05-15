import { pipe } from 'fp-ts/lib/pipeable';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import { Page } from 'puppeteer';

import { ERROR, SELECTOR, XPATH } from './constants';
import { Credential, getCredential } from './setting';
import { teprint } from './utils';

/**
 * Login to King of Time
 * @param {string} profile specifying the profile of credential
 */
export const login =
  (profile: string): RTE.ReaderTaskEither<Page, Error, Page> =>
  (page: Page): TE.TaskEither<Error, Page> =>
    pipe(
      getCredential(profile),
      TE.fromIOEither,
      TE.chain((credential) => pipe(gotoLoginPage(credential)(page), TE.chain(tryToLogin(credential))))
    );

const buildLoginPageUrl = (credential: Credential): string => `https://${credential.type}.kingtime.jp/admin`;

const gotoLoginPage =
  (credential: Credential): RTE.ReaderTaskEither<Page, Error, Page> =>
  (page: Page): TE.TaskEither<Error, Page> =>
    pipe(
      buildLoginPageUrl(credential),
      (url) =>
        pipe(
          teprint(`going to the login page. URL: ${url}`),
          TE.chain(() =>
            TE.tryCatch(
              () => page.goto(url),
              () => new Error(ERROR.GO_TO_LOGIN_PAGE(url))
            )
          )
        ),
      TE.chain<Error, unknown, void>(() => teprint('loading the login page')),
      TE.chain(() =>
        TE.tryCatch(
          () =>
            Promise.all(
              [SELECTOR.FORM_LOGIN_ID, SELECTOR.FORM_LOGIN_PASSWORD, SELECTOR.BUTTON_LOGIN].map((selector) =>
                page.waitForSelector(selector)
              )
            ),
          () => new Error(ERROR.LOAD_LOGIN_PAGE)
        )
      ),
      TE.chain(() => TE.taskEither.of(page))
    );

const tryToLogin =
  ({ id, password }: Credential): RTE.ReaderTaskEither<Page, Error, Page> =>
  (page: Page): TE.TaskEither<Error, Page> =>
    pipe(
      teprint(`trying to login. ID: ${id}`),
      TE.chain(() =>
        TE.tryCatch(
          async () => {
            await page.type(SELECTOR.FORM_LOGIN_ID, id);
            await page.type(SELECTOR.FORM_LOGIN_PASSWORD, password);
            await page.click(SELECTOR.BUTTON_LOGIN);
          },
          () => new Error(ERROR.TRY_TO_LOGIN)
        )
      ),
      TE.chain(() =>
        TE.tryCatch(
          // Successful login: resolves detectTimeCardPage
          // Failed to login:
          //   case1. Incorrect credentials
          //     -> rejects detectLoginFailure and then throws error
          //   case2. The page transition timed out(Regardless of whether the credentials are correct or not)
          //     -> rejects detectLoginFailure of detectTimeCardPage and then throws error
          () => Promise.race([detectLoginFailure(page), detectTimeCardPage(page)]),
          (reason): Error => {
            if (reason instanceof Error) {
              return new Error(ERROR.LOGIN(reason.message));
            }
            // Throws unexpected error because it is unknown whether an error other than the Error type will occur.
            return new Error(ERROR.UNEXPECTED(reason));
          }
        )
      ),
      TE.chain(() => TE.taskEither.of(page))
    );

const detectLoginFailure = async (page: Page): Promise<void> => {
  try {
    const handle = await page.waitForSelector(SELECTOR.LOGIN_ERROR_MESSAGE);
    const message = await handle.evaluate((element) => element.textContent);
    return Promise.reject(message);
  } catch (e) {
    return Promise.reject(e);
  }
};

/**
 * Detects page transition to the time card page.
 * @param {Page} page page instance of King of Time
 */
export const detectTimeCardPage = async (page: Page): Promise<void> => {
  // When both detectTimeCardPage and an another function are timed out,
  // if the number of seconds until the timeout is the same,
  // it is expected that the result of the error becomes random,
  // so the number of seconds of the timeout is changed to avoid it.
  await page.waitForXPath(XPATH.DETECT_TIMECARD_PAGE, { timeout: 25 * 1000 });
};
