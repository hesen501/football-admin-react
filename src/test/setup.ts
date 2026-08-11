import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// RTL's cleanup normally auto-registers via a detected global `afterEach`,
// which needs `test.globals: true` in the Vitest config. This project keeps
// vitest APIs explicitly imported instead (matching its no-globals-magic
// style elsewhere), so cleanup is wired up by hand here — without it, each
// test's render() output accumulates in the DOM across tests in the same file.
afterEach(() => {
  cleanup();
});
