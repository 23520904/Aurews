export type AnalyticsProvider = {
  track: (event: string, properties?: Record<string, any>) => void;
};

let provider: AnalyticsProvider = {
  track: (event, properties) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log("[analytics]", event, properties || {});
    }
    // TODO: Optionally POST to backend analytics endpoint
  },
};

export function setAnalyticsProvider(p: AnalyticsProvider) {
  provider = p;
}

export function track(event: string, properties?: Record<string, any>) {
  try {
    provider.track(event, properties);
  } catch {}
}

