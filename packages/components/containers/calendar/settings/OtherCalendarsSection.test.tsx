import { Router } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import { UserModel } from '@proton/shared/lib/interfaces';

import { CacheProvider } from '../../cache';
import ModalsProvider from '../../modals/Provider';
import OtherCalendarsSection, { OtherCalendarsSectionProps } from './OtherCalendarsSection';

jest.mock('../../../hooks/useApi', () => () => jest.fn(() => Promise.resolve({})));
jest.mock('@proton/components/hooks/useConfig', () => () => ({
    CLIENT_TYPE: 1,
    CLIENT_SECRET: 'not_so_secret',
    APP_VERSION: 'test',
    APP_NAME: 'proton-calendar',
    API_URL: 'api',
    LOCALES: {},
    DATE_VERSION: 'test',
    COMMIT: 'test',
    BRANCH: 'test',
    SENTRY_DSN: 'test',
    VERSION_PATH: 'test',
}));
jest.mock('../../../hooks/useEarlyAccess', () => () => ({}));
jest.mock('../../../hooks/useFeatures', () => () => ({}));
jest.mock('../../../hooks/useSubscribedCalendars', () => jest.fn(() => ({ loading: true })));
jest.mock('../../../hooks/useEventManager', () => jest.fn(() => ({ subscribe: jest.fn() })));
jest.mock('../../eventManager/calendar/useCalendarsInfoListener', () => () => ({}));
jest.mock('../../eventManager/calendar/ModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(() => ({ subscribe: jest.fn() })),
}));
jest.mock('@proton/components/hooks/useNotifications', () => () => ({}));
jest.mock('@proton/components/hooks/useCalendarSubscribeFeature', () =>
    jest.fn(() => ({ enabled: true, unavailable: false }))
);

let memoryHistory = createMemoryHistory();

function renderComponent(props?: Partial<OtherCalendarsSectionProps>) {
    const defaultProps: OtherCalendarsSectionProps = {
        addresses: [],
        subscribedCalendars: [],
        sharedCalendars: [],
        calendarInvitations: [],
        unknownCalendars: [],
        user: { isFree: true, hasNonDelinquentScope: true } as UserModel,
        canAdd: true,
        isCalendarsLimitReached: false,
    };

    return (
        <ModalsProvider>
            <Router history={memoryHistory}>
                <CacheProvider cache={createCache()}>
                    <OtherCalendarsSection {...defaultProps} {...props} />
                </CacheProvider>
            </Router>
        </ModalsProvider>
    );
}

// TODO: change into a test for CalendarSettingsSection
describe.skip('OtherCalendarsSection', () => {
    it('displays the calendar limit warning when the limit is reached', () => {
        // const calendars = Array(MAX_CALENDARS_PAID)
        //     .fill(1)
        //     .map((_, index) => ({
        //         ID: `${index}`,
        //         Name: `calendar${index}`,
        //         color: '#f00',
        //     })) as unknown as SubscribedCalendar[];

        const { rerender } = render(renderComponent({}));

        const maxReachedCopy = `You have reached the maximum of ${MAX_CALENDARS_PAID} subscribed calendars.`;
        const createCalendarCopy = 'Add calendar';

        expect(screen.getByText(maxReachedCopy)).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeDisabled();

        rerender(renderComponent());

        expect(screen.queryByText(maxReachedCopy)).not.toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).not.toBeDisabled();
    });
});
