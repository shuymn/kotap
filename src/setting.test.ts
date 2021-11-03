import os from "os";
import path from "path";
import rewire from "rewire";

import { ENV, PROJECT_NAME } from "./constants";

const setting = rewire("./setting");

describe("getSettingDir", () => {
  const getSettingDir = setting.__get__("getSettingDir");

  test("exported KOTAP_CONFIG_DIR", () => {
    const env = path.join("foo", "bar");
    const expected = env;

    const obj = {
      process: {
        env: {
          [ENV.KOTAP_CONFIG_DIR]: env,
        },
      },
    };

    setting.__with__(obj)(() => expect(getSettingDir()).toBe(expected));
  });

  test("exported XDG_CONFIG_HOME", () => {
    const env = path.join("hoge", "fuga");
    const expected = path.join(env, PROJECT_NAME);

    const obj = {
      process: {
        env: {
          [ENV.XDG_CONFIG_HOME]: env,
        },
      },
    };

    setting.__with__(obj)(() => expect(getSettingDir()).toBe(expected));
  });

  test("home directory", () => {
    const expected = path.join(os.homedir(), `.${PROJECT_NAME}`);

    const obj = {
      process: {
        env: {},
      },
    };

    setting.__with__(obj)(() => expect(getSettingDir()).toBe(expected));
  });
});
