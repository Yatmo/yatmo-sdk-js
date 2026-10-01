import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // happy-dom must not fetch the iframe pages and scripts the components point at.
    environmentOptions: {
      happyDOM: {
        settings: { disableIframePageLoading: true, disableJavaScriptFileLoading: true, disableCSSFileLoading: true },
      },
    },
  },
});
