import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { NotificationProvider } from '../context/NotificationContext';

// Every page under test calls useNotification() (directly or via a child),
// so this is the one provider virtually all of them need. Pages that also
// need routing (useParams/useNavigate) wrap themselves in a MemoryRouter
// locally — that's specific enough per-test not to belong here.
export const renderWithNotifications = (ui: ReactElement) => render(<NotificationProvider>{ui}</NotificationProvider>);
