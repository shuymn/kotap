import { description, version } from '../package.json';

export const PROJECT_NAME = 'kotap';
export const PROJECT_VERSION = version;
export const PROJECT_DESCRIPTION = description;

export const ENV = {
  KOTAP_CONFIG_DIR: 'KOTAP_CONFIG_DIR',
  XDG_CONFIG_HOME: 'XDG_CONFIG_HOME',
  USERPROFILE: 'USERPROFILE',
  HOME: 'HOME',
};

export const ERROR = {
  OFFLINE: 'Failed to connect to the internet. Maybe be offile',
  NO_CREDENTIALS_FILE: (fullpath: string): string => `Could not read credentials file.\nPath: ${fullpath}`,
  INVALID_JSON: (fullpath: string): string => `Invalid json file given.\nPath: ${fullpath}`,
  NO_CREDENTIAL_PROFILE: (profile: string): string => `Profile: ${profile} is not found`,
  INVALID_CREDENTIAL: (profile: string): string => `The schema of credential profile "${profile}" is invalid`,
  LAUNCH_BROWSER: 'Failed to launch the browser',
  INITIALIZE_PAGE: 'Failed to page initialization',
  GO_TO_LOGIN_PAGE: (url: string): string => `Failed to go to the login page.\nURL: ${url}`,
  LOAD_LOGIN_PAGE: 'Failed to load the login page',
  TRY_TO_LOGIN: 'An error occurred while attempting to login',
  CLOSE_BROWSER: 'Failed to close the browser',
  LOGIN: (reason: string): string => `Failed to login.\nReason: ${reason}`,
  UNEXPECTED: <T>(reason: T): string => 'Unexpected error occurred' + (reason ? `.\nDetail: ${reason}` : ''),
  GO_TO_REQUEST_PAGE: 'Failed to go to the request page',
  LOAD_REQUEST_PAGE: 'Failed to load the request page',
  DETECT_RECORDING_TYPE: (reason: string): string =>
    `Failed to detect the recording type.\nReason: ${reason}`,
  EMPTY_MESSAGE: 'A message is required due to punch in/out by request',
  INVALID_DATE: 'Invalid date given. The format of a date is yyyy-MMdd-HHmm (e.g. 2020-0204-0304)',
  INVALID_TYPE: 'Invalid type given. Only both "request" and "recorder" are supported',
  ALREADY_DONE: 'Both punching in and punching out on the specified date has already done',
  INPUT_RECORDING_TIMESTAMP: 'Failed to input recording timestamp',
  TRY_TO_REQUEST_RECORDING: 'An error occurred while requesting to record',
  REQUEST_RECORDING: (reason: string): string => `Failed to request to record.\nReason: ${reason}`,
};

export const SELECTOR = {
  FORM_LOGIN_ID: '#login_id',
  FORM_LOGIN_PASSWORD: '#login_password',
  BUTTON_LOGIN: '#login_button',
  LOGIN_ERROR_MESSAGE: '.login_form_message > span.htBlock-warnA',
  INPUT_TYPE_SUBMIT: 'input[type=submit]',
  INPUT_RECORDING_TIMESTAMP: 'input[id=recording_timestamp_time_1]',
  INPUT_REQUEST_MESSAGE: 'input[name=request_remark_1]',
  SELECT_RECORDING_TYPE: '#recording_type_code_1',
  BUTTON_REQUEST: '#button_01',
  REQUEST_ERROR_MESSAGE: 'ul.htBlock-messageArea--error > li',
};

export const XPATH = {
  DETECT_TIMECARD_PAGE:
    '//body/div[contains(@class, "htBlock-body") and not(contains(@class, "specific-working_edit"))]',
  PARENT_OF_WORKING_DATE_INPUT: (yyyymmdd: string): string =>
    `//input[@name='working_date' and @value='${yyyymmdd}']/parent::node()`,
  PENDING_PUNCHING_IN:
    "//td[@class='htBlock-normalTable_actionRow']/following-sibling::td[contains(text(), '出勤')]",
  PENDING_PUNCHING_OUT:
    "//td[@class='htBlock-normalTable_actionRow']/following-sibling::td[contains(text(), '退勤')]",
  APPROVED_PUNCHING_IN: "//select[@id='recording_type_code']/option[@selected and contains(text(), '出勤')]",
  APPROVED_PUNCHING_OUT: "//select[@id='recording_type_code']/option[@selected and contains(text(), '退勤')]",
  RECORDING_TIMESTAMP_HOUR: (hh: string): string =>
    `//input[@id='recording_timestamp_hour_1' and @value='${hh}']`,
  RECORDING_TIMESTAMP_MINUTE: (mm: string): string =>
    `//input[@id='recording_timestamp_minute_1' and @value='${mm}']`,
};

export const DATE_FORMAT = {
  DEFAULT_FULL: 'yyyy-MMdd-HHmm',
  DEFAULT: 'MMdd-HHmm',
  WORKING_DATE: 'yyyyMMdd',
  RECORDING_TIMESTAMP: 'HHmm',
};
