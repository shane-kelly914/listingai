import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="ListingAI - AI-powered real estate listing descriptions" />
        <title>ListingAI</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalStyles = `
  /* CSS Reset & Foundation */
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f9fafb;
    color: #1f2937;
  }

  #root {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  /* Fix React Native Web flex defaults */
  div[data-rnw-int-id], div[data-rnwi] {
    display: flex;
    flex-direction: column;
  }

  /* Ensure inputs look right */
  input, textarea, select {
    font-family: inherit;
    font-size: 14px;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  input:focus, textarea:focus {
    border-color: #E8862A !important;
    box-shadow: 0 0 0 2px rgba(232, 134, 42, 0.15);
  }

  /* Fix ScrollView */
  [data-testid="scrollview"] {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
  }

  /* Smooth scrolling */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }

  /* Prevent text selection on buttons */
  [role="button"] {
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
  }

  /* Fix images */
  img {
    max-width: 100%;
    height: auto;
  }

  /* Fix TouchableOpacity hover states */
  [role="button"]:hover {
    opacity: 0.85;
    transition: opacity 0.15s ease;
  }

  /* Constrain max width for desktop */
  @media (min-width: 768px) {
    body > div > div > div {
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
      width: 100%;
    }
  }

  /* Fix tab bar for web */
  [role="tablist"] {
    border-top: 1px solid #e5e7eb;
  }
`;
