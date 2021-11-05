import { pipe } from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import puppeteer from "puppeteer";
import { ERROR } from "./constants";
import { checkOnline, Result, teprint } from "./utils";

export type BrowseFunc = (page: puppeteer.Page) => Result;

export const browse = (
  f: BrowseFunc,
  options?: puppeteer.LaunchOptions
): Result =>
  TE.bracket(
    launchBrowser(options),
    (browser) => pipe(initializePage(browser), TE.chain(f)),
    (browser) => closeBrowser(browser)
  );

const launchBrowser = (
  options?: puppeteer.LaunchOptions
): TE.TaskEither<Error, puppeteer.Browser> =>
  pipe(
    teprint("launching the browser"),
    TE.chain(() => checkOnline),
    TE.chain(() =>
      TE.tryCatch(
        () => puppeteer.launch(options),
        () => new Error(ERROR.LAUNCH_BROWSER)
      )
    )
  );

const initializePage = (
  browser: puppeteer.Browser
): TE.TaskEither<Error, puppeteer.Page> =>
  pipe(
    teprint("initializing the new page"),
    TE.chain(() =>
      TE.tryCatch(
        async () => {
          const page = await browser.newPage();
          await page.setRequestInterception(true);
          return page.on("request", (request) => {
            const abortables: puppeteer.ResourceType[] = [
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

const closeBrowser = (browser: puppeteer.Browser): TE.TaskEither<Error, void> =>
  pipe(
    teprint("closing the browser"),
    TE.chain(() =>
      TE.tryCatch(
        () => browser.close(),
        () => new Error(ERROR.CLOSE_BROWSER)
      )
    )
  );
