export enum FilterType {
  ISSUE = "ISSUE",
  BOOLEAN = "BOOLEAN",
  NUMBER = "NUMBER",
  DURATION = "DURATION",
  MULTIPLE = "MULTIPLE",
  COUNTRY = "COUNTRY",
};

export enum FilterKey {
  ERROR = "ERROR",
  MISSING_RESOURCE = "MISSING_RESOURCE",
  SLOW_SESSION = "SLOW_SESSION",
  CLICK_RAGE = "CLICK_RAGE",
  CLICK = "CLICK",
  INPUT = "INPUT",
  LOCATION = "LOCATION",
  VIEW = "VIEW",
  CONSOLE = "CONSOLE",
  METADATA = "METADATA",
  CUSTOM = "CUSTOM",
  URL = "URL",
  USER_BROWSER = "USERBROWSER",
  USER_OS = "USEROS",
  USER_DEVICE = "USERDEVICE",
  PLATFORM = "PLATFORM",
  DURATION = "DURATION",
  REFERRER = "REFERRER",
  USER_COUNTRY = "USER_COUNTRY",
  JOURNEY = "JOURNEY",
  FETCH = "FETCH",
  GRAPHQL = "GRAPHQL",
  STATEACTION = "STATEACTION",
  REVID = "REVID",
  USERANONYMOUSID = "USERANONYMOUSID",
  USERID = "USERID",
  ISSUE = "ISSUE",
  EVENTS_COUNT = "EVENTS_COUNT",
  UTM_SOURCE = "UTM_SOURCE",
  UTM_MEDIUM = "UTM_MEDIUM",
  UTM_CAMPAIGN = "UTM_CAMPAIGN",
  
  DOM_COMPLETE = "DOM_COMPLETE",
  LARGEST_CONTENTFUL_PAINT_TIME = "LARGEST_CONTENTFUL_PAINT_TIME",
  TIME_BETWEEN_EVENTS = "TIME_BETWEEN_EVENTS",
  TTFB = "TTFB",
  AVG_CPU_LOAD = "AVG_CPU_LOAD",
  AVG_MEMORY_USAGE = "AVG_MEMORY_USAGE",
}