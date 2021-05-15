import { Spinner } from 'cli-spinner';
import * as IO from 'fp-ts/lib/IO';

const spinner = new Spinner();

export const spinWith =
  (title: string): IO.IO<void> =>
  (): void => {
    spinner.setSpinnerTitle(title);
    if (!spinner.isSpinning()) {
      spinner.start();
    }
  };

export const stopSpinning = (): IO.IO<void> => (): void => {
  if (spinner.isSpinning()) {
    spinner.stop(true);
  }
};
