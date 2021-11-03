import { pipe } from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import { Browser, launch, LaunchOptions, Page, ResourceType } from "puppeteer";

import { ERROR } from "./constants";
import { checkOnline, Result, teprint } from "./utils";

export type BrowseFunc = (page: Page) => Result;

export const browse = (f: BrowseFunc, options?: LaunchOptions): Result =>
  TE.bracket(
    launchBrowser(options),
    (browser) => pipe(initializePage(browser), TE.chain(f)),
    (browser) => closeBrowser(browser)
  );

const launchBrowser = (
  options?: LaunchOptions
): TE.TaskEither<Error, Browser> =>
  pipe(
    teprint("launching the browser"),
    TE.chain(() => checkOnline),
    TE.chain(() =>
      TE.tryCatch(
        () => launch(options),
        () => new Error(ERROR.LAUNCH_BROWSER)
      )
    )
  );

const initializePage = (browser: Browser): TE.TaskEither<Error, Page> =>
  pipe(
    teprint("initializing the new page"),
    TE.chain(() =>
      TE.tryCatch(
        async () => {
          const page = await browser.newPage();
          await page.setRequestInterception(true);
          return page.on("request", (request) => {
            const abortables: ResourceType[] = [
              "stylesheet",
              "image",
              "media",
              "font",
            ];
            if (abortables.includes(request.resourceType())) {
              request.abort();
            } else {
              request.continue();
            }
          });
        },
        () => new Error(ERROR.INITIALIZE_PAGE)
      )
    )
  );

const closeBrowser = (browser: Browser): TE.TaskEither<Error, void> =>
  pipe(
    teprint("closing the browser"),
    TE.chain(() =>
      TE.tryCatch(
        () => browser.close(),
        () => new Error(ERROR.CLOSE_BROWSER)
      )
    )
  );
