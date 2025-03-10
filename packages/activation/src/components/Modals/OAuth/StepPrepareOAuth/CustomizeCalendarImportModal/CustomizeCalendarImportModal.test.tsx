import { fireEvent, screen } from '@testing-library/dom';

import { ImporterCalendar } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.interface';
import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { mockAddresses } from '@proton/activation/src/tests/data/addresses';
import { prepareState } from '@proton/activation/src/tests/data/prepareState';
import { easySwitchRender } from '@proton/activation/src/tests/render';
import { ModalStateProps } from '@proton/components/index';
import { CALENDAR_DISPLAY, CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { CalendarMember, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CustomizeCalendarImportModal from './CustomizeCalendarImportModal';
import { DerivedCalendarType } from './useCustomizeCalendarImportModal';

const modalProps: ModalStateProps = {
    key: 'modalProps',
    open: true,
    onClose: () => {},
    onExit: () => {},
};

const calendarMember: CalendarMember = {
    ID: 'id',
    CalendarID: 'CalendarID',
    AddressID: 'AddressID',
    Flags: 1,
    Name: 'Name',
    Description: 'Description',
    Email: 'Email',
    Permissions: 1,
    Color: 'Color',
    Display: CALENDAR_DISPLAY.VISIBLE,
};

const visualCalendar: VisualCalendar = {
    Owner: { Email: 'testing@proton.ch' },
    Members: [calendarMember],
    ID: 'id',
    Type: CALENDAR_TYPE.PERSONAL,
    Name: 'visualCalendar',
    Description: 'visualCalendar',
    Color: 'visualCalendar',
    Display: CALENDAR_DISPLAY.VISIBLE,
    Email: 'testing@proton.ch',
    Flags: 1,
    Permissions: 1,
};

const importerCalendar: ImporterCalendar = {
    source: 'testing',
    description: 'testing',
    id: 'testing',
    checked: true,
};

const derivedValuesNoErrors: DerivedCalendarType = {
    selectedCalendars: [importerCalendar],
    calendarsToBeCreatedCount: 1,
    calendarLimitReached: false,
    selectedCalendarsCount: 1,
    disabled: false,
    calendarToFixCount: 0,
    canMerge: true,
    totalCalendarsCount: 10,
    calendarsToBeMergedCount: 2,
};

jest.mock('@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector', () => ({
    ...jest.requireActual('@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector'),
    selectOauthImportStateImporterData: jest.fn(),
}));

jest.mock('@proton/activation/src/hooks/useAvailableAddresses', () => () => ({
    availableAddresses: mockAddresses,
    loading: false,
    defaultAddress: mockAddresses[0],
}));

const mockSelectorImporterData = selectOauthImportStateImporterData as any as jest.Mock<
    ReturnType<typeof selectOauthImportStateImporterData>
>;

describe('CustomizeCalendarImportModal', () => {
    it('Should render customize calendar modal', () => {
        mockSelectorImporterData.mockImplementation(() => prepareState.mailImport?.importerData);

        const standardProps = {
            modalProps,
            providerCalendarsState: [importerCalendar],
            derivedValues: derivedValuesNoErrors,
            activeWritableCalendars: [visualCalendar],
            handleSubmit: () => {},
            handleCalendarToggle: () => {},
            handleMappingChange: () => {},
        };

        easySwitchRender(<CustomizeCalendarImportModal {...standardProps} />);
        screen.getByTestId('CustomizeCalendarImportModal:description');
    });

    it('Should render calendar limit reached', () => {
        mockSelectorImporterData.mockImplementation(() => prepareState.mailImport?.importerData);

        const derivedValuesWithErrors = { ...derivedValuesNoErrors, calendarLimitReached: true };
        const standardProps = {
            modalProps,
            providerCalendarsState: [importerCalendar],
            derivedValues: derivedValuesWithErrors,
            activeWritableCalendars: [visualCalendar],
            handleSubmit: () => {},
            handleCalendarToggle: () => {},
            handleMappingChange: () => {},
        };

        easySwitchRender(<CustomizeCalendarImportModal {...standardProps} />);
        screen.getByTestId('CustomizeCalendarImportModalLimitReached:container');
    });

    it('Should render different elements if cannot merge', () => {
        mockSelectorImporterData.mockImplementation(() => prepareState.mailImport?.importerData);

        const derivedValuesNoMerge = { ...derivedValuesNoErrors, canMerge: false };
        const standardProps = {
            modalProps,
            providerCalendarsState: [importerCalendar],
            derivedValues: derivedValuesNoMerge,
            activeWritableCalendars: [visualCalendar],
            handleSubmit: () => {},
            handleCalendarToggle: () => {},
            handleMappingChange: () => {},
        };

        easySwitchRender(<CustomizeCalendarImportModal {...standardProps} />);
        screen.getByTestId('CustomizeCalendarImportModal:description');
    });

    it('Should click the checkbox of a calendar', () => {
        mockSelectorImporterData.mockImplementation(() => prepareState.mailImport?.importerData);

        const standardProps = {
            modalProps,
            providerCalendarsState: [importerCalendar],
            derivedValues: derivedValuesNoErrors,
            activeWritableCalendars: [visualCalendar],
            handleSubmit: () => {},
            handleCalendarToggle: () => {},
            handleMappingChange: () => {},
        };

        easySwitchRender(<CustomizeCalendarImportModal {...standardProps} />);

        const checkboxes = screen.getAllByTestId('CustomizeCalendarImportRow:checkbox');
        expect(checkboxes).toHaveLength(standardProps.providerCalendarsState.length);
        fireEvent.click(checkboxes[0]);
    });
});
