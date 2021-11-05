#!/usr/bin/env node

import { Command } from "commander";
import { punch } from "./commands/punch";
import {
  DATE_FORMAT,
  PROJECT_DESCRIPTION,
  PROJECT_NAME,
  PROJECT_VERSION,
} from "./constants";
import { handle } from "./handle";

const cmd = new Command();
cmd.version(PROJECT_VERSION);

cmd
  .name(PROJECT_NAME)
  .usage("<command> [options]")
  .description(`${PROJECT_NAME} - ${PROJECT_DESCRIPTION}`);

cmd
  .command("punch")
  .option(
    "-t, --type <type>",
    "The type of recording. There are two types of support: recorder and request",
    "recorder"
  )
  .option("-p, --profile <profile>", "The profile of credentials", "default")
  .option(
    "-m, --message <message>",
    "The request message. It is required if the type is request"
  )
  .option(
    "-d, --date <date>",
    `The date to record. It should be written in the following format: ${DATE_FORMAT.DEFAULT_FULL}`
  )
  .action(handle(punch));

cmd.parse(process.argv);
