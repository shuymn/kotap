# kotap

> :warning: **This application is still under development and has only the minimum functionality required by the author.**

CLI tool for punching by King of Time.

## Install

There is only a way to run `kotap` manually.

First, clone `kotap`:

```bash
git clone https://github.com/shuymn/kotap
```

Second, build and install:

```bash
npm run build
```

## Commands

The following command provide basic King of Time operation.

> Note: Most of them require you to [prepare the credential file](https://github.com/shuymn/kotap#credential-file).

- `kotap punch [--type <type>] [--message <message>] [--date <date>]`

## Reference

### Punch

> Note: **[Credential File](https://github.com/shuymn/kotap#credential-file) setting is required.**

Punch with specified messages and date. It will be punched with the current time if no date is specified.

#### Options

- `--type <type>`: `request` or `recorder`(_Note: **Unsupported**_). `request` is a punching request by 打刻申請(Punching Request). `recorder` is a punching by レコーダー(Recorder).
- `--message <message>`: Add a reason message with `--type request`(Required).
- `--date <date>`: Add a time to punch with `--type request`(Optional). The format is `YYYY-MMDD-HHmm`. _Note: **Dates other than the current month are not supported**_

## Credential File

When running `punch`, a file named `credentials.json` is required in following directories to describe `kotap`'s configuration to login King of Time.

- `$XDG_CONFIG_HOME/kotap/credentials.json`
- `~/kotap/credentials.json`
- `$KOTAP_CONFIG_DIR/credentials.json`

Example `credentials.json`

```json
{
  "type": "s2",
  "id": "example_id",
  "password": "example_password"
}
```

### `type` (Required)

> Note: **Only `s2` and `s3` are supported.**

Specifies the url type of your King of Time account.

If your login URL starts with `https://s2.kingtime.jp/admin/`, select `s2`. If it starts with `https://s3.kingtime.jp/admin/`, select `s3`.

### `id` (Required)

Specifies the id of your King of Time account.

### `password` (Required)

Specifies the password of your King of Time account.
