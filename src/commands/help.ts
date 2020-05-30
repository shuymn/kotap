import commander from 'commander';
import { taskEither } from 'fp-ts/lib/TaskEither';

import { Command } from '../handle';

export const help: Command<void> = () => taskEither.of(commander.outputHelp());
