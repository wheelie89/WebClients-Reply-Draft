import React, { ReactNode, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AppsDropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    Sidebar,
    SidebarList,
    SidebarListItemHeaderLink,
    SidebarNav,
    SidebarPrimaryButton,
    SimpleDropdown,
    SimpleSidebarListItemHeader,
    Tooltip,
    useApi,
    useCalendarSubscribeFeature,
    useEventManager,
    useLoading,
    useModalState,
    useNotifications,
    useUser,
} from '@proton/components';
import CalendarLimitReachedModal from '@proton/components/containers/calendar/CalendarLimitReachedModal';
import { CalendarModal } from '@proton/components/containers/calendar/calendarModal/CalendarModal';
import SubscribedCalendarModal from '@proton/components/containers/calendar/subscribedCalendarModal/SubscribedCalendarModal';
import useSubscribedCalendars from '@proton/components/hooks/useSubscribedCalendars';
import { updateMember } from '@proton/shared/lib/api/calendars';
import { groupCalendarsByTaxonomy, sortCalendars } from '@proton/shared/lib/calendar/calendar';
import { getHasUserReachedCalendarsLimit } from '@proton/shared/lib/calendar/calendarLimits';
import { getMemberAndAddress } from '@proton/shared/lib/calendar/members';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS } from '@proton/shared/lib/constants';
import { Address } from '@proton/shared/lib/interfaces';
import { CalendarUserSettings, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CalendarSidebarListItems from './CalendarSidebarListItems';
import CalendarSidebarVersion from './CalendarSidebarVersion';

export interface CalendarSidebarProps {
    addresses: Address[];
    calendars: VisualCalendar[];
    calendarUserSettings: CalendarUserSettings;
    expanded?: boolean;
    logo?: ReactNode;
    miniCalendar: ReactNode;
    onToggleExpand: () => void;
    onCreateEvent?: () => void;
    onCreateCalendar?: (id: string) => void;
}

const CalendarSidebar = ({
    addresses,
    calendars,
    calendarUserSettings,
    logo,
    expanded = false,
    onToggleExpand,
    miniCalendar,
    onCreateEvent,
    onCreateCalendar,
}: CalendarSidebarProps) => {
    const { call } = useEventManager();
    const api = useApi();
    const [user] = useUser();
    const { enabled, unavailable } = useCalendarSubscribeFeature();

    const [loadingAction, withLoadingAction] = useLoading();
    const { createNotification } = useNotifications();

    const [calendarModal, setIsCalendarModalOpen, renderCalendarModal] = useModalState();
    const [subscribedCalendarModal, setIsSubscribedCalendarModalOpen, renderSubscribedCalendarModal] = useModalState();
    const [isLimitReachedModal, setIsLimitReachedModalOpen, renderIsLimitReachedModal] = useModalState();

    const headerRef = useRef(null);
    const dropdownRef = useRef(null);

    const {
        ownedPersonalCalendars: myCalendars,
        sharedCalendars,
        subscribedCalendars: subscribedCalendarsWithoutParams,
        unknownCalendars,
    } = useMemo(() => {
        return groupCalendarsByTaxonomy(calendars);
    }, [calendars]);
    const { subscribedCalendars, loading: loadingSubscribedCalendars } = useSubscribedCalendars(
        subscribedCalendarsWithoutParams
    );
    const otherCalendars = sortCalendars([
        ...(loadingSubscribedCalendars ? subscribedCalendarsWithoutParams : subscribedCalendars),
        ...sharedCalendars,
        ...unknownCalendars,
    ]);

    const { isCalendarsLimitReached, isOtherCalendarsLimitReached } = getHasUserReachedCalendarsLimit(
        calendars,
        !user.hasPaidMail
    );

    const addCalendarText = c('Dropdown action icon tooltip').t`Add calendar`;

    const handleChangeVisibility = async (calendarID: string, checked: boolean) => {
        const members = calendars.find(({ ID }) => ID === calendarID)?.Members || [];
        const [{ ID: memberID }] = getMemberAndAddress(addresses, members);
        await api(updateMember(calendarID, memberID, { Display: checked ? 1 : 0 }));
        await call();
    };

    const handleCreatePersonalCalendar = async () => {
        if (!isCalendarsLimitReached) {
            setIsCalendarModalOpen(true);
        } else {
            setIsLimitReachedModalOpen(true);
        }
    };

    const handleCreateSubscribedCalendar = () => {
        if (!isOtherCalendarsLimitReached) {
            setIsSubscribedCalendarModalOpen(true);
        } else {
            setIsLimitReachedModalOpen(true);
        }
    };

    const primaryAction = (
        <SidebarPrimaryButton
            data-test-id="calendar-view:new-event-button"
            disabled={!onCreateEvent}
            onClick={onCreateEvent}
            className="no-mobile"
        >{c('Action').t`New event`}</SidebarPrimaryButton>
    );

    const [displayMyCalendars, setDisplayMyCalendars] = useState(true);
    const [displayOtherCalendars, setDisplayOtherCalendars] = useState(true);

    const headerButton = (
        <Tooltip title={c('Info').t`Manage your calendars`}>
            <SidebarListItemHeaderLink
                toApp={APPS.PROTONACCOUNT}
                to={getCalendarsSettingsPath({ fullPath: true })}
                target="_self"
                icon="cog-wheel"
                info={c('Link').t`Calendars`}
            />
        </Tooltip>
    );

    const myCalendarsList = (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayMyCalendars}
                onToggle={() => setDisplayMyCalendars((prevState) => !prevState)}
                right={
                    <div className="flex flex-nowrap flex-align-items-center pr0-75">
                        {enabled && !isOtherCalendarsLimitReached ? (
                            <Tooltip title={addCalendarText}>
                                <SimpleDropdown
                                    as="button"
                                    type="button"
                                    hasCaret={false}
                                    className="navigation-link-header-group-control flex"
                                    content={<Icon name="plus" className="navigation-icon" alt={addCalendarText} />}
                                    ref={dropdownRef}
                                >
                                    <DropdownMenu>
                                        <DropdownMenuButton
                                            className="text-left"
                                            onClick={handleCreatePersonalCalendar}
                                        >
                                            {c('Action').t`Create calendar`}
                                        </DropdownMenuButton>
                                        <DropdownMenuButton
                                            className="text-left"
                                            onClick={() =>
                                                unavailable
                                                    ? createNotification({
                                                          type: 'error',
                                                          text: c('Subscribed calendar feature unavailable error')
                                                              .t`Subscribing to a calendar is unavailable at the moment`,
                                                      })
                                                    : handleCreateSubscribedCalendar()
                                            }
                                        >
                                            {c('Calendar sidebar dropdown item').t`Add calendar from URL`}
                                        </DropdownMenuButton>
                                    </DropdownMenu>
                                </SimpleDropdown>
                            </Tooltip>
                        ) : (
                            <Button
                                shape="ghost"
                                color="weak"
                                size="medium"
                                icon
                                className="navigation-link-header-group-control"
                            >
                                <Tooltip title={addCalendarText}>
                                    <Icon
                                        onClick={handleCreatePersonalCalendar}
                                        name="plus"
                                        className="navigation-icon"
                                        alt={addCalendarText}
                                    />
                                </Tooltip>
                            </Button>
                        )}
                        {headerButton}
                    </div>
                }
                text={c('Link').t`My calendars`}
                testId="calendar-sidebar:my-calendars-button"
            />
            {displayMyCalendars && (
                <CalendarSidebarListItems
                    calendars={myCalendars}
                    onChangeVisibility={(calendarID, value) =>
                        withLoadingAction(handleChangeVisibility(calendarID, value))
                    }
                    addresses={addresses}
                    loading={loadingAction}
                />
            )}
        </SidebarList>
    );

    const otherCalendarsList = otherCalendars.length ? (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayOtherCalendars}
                onToggle={() => setDisplayOtherCalendars((prevState) => !prevState)}
                text={c('Link').t`Other calendars`}
                testId="calendar-sidebar:other-calendars-button"
                headerRef={headerRef}
            />
            {displayOtherCalendars && (
                <CalendarSidebarListItems
                    actionsDisabled={loadingSubscribedCalendars}
                    calendars={otherCalendars}
                    onChangeVisibility={(calendarID, value) =>
                        withLoadingAction(handleChangeVisibility(calendarID, value))
                    }
                    addresses={addresses}
                    loading={loadingAction}
                />
            )}
        </SidebarList>
    ) : null;

    return (
        <Sidebar
            appsDropdown={<AppsDropdown app={APPS.PROTONCALENDAR} />}
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            primary={primaryAction}
            version={<CalendarSidebarVersion />}
        >
            {renderCalendarModal && (
                <CalendarModal
                    {...calendarModal}
                    calendars={calendars}
                    defaultCalendarID={calendarUserSettings.DefaultCalendarID}
                    onCreateCalendar={onCreateCalendar}
                />
            )}
            {renderSubscribedCalendarModal && (
                <SubscribedCalendarModal {...subscribedCalendarModal} onCreateCalendar={onCreateCalendar} />
            )}
            {renderIsLimitReachedModal && (
                <CalendarLimitReachedModal {...isLimitReachedModal} isFreeUser={!user.hasPaidMail} />
            )}

            <SidebarNav data-test-id="calendar-sidebar:calendars-list-area">
                <div className="flex-item-noshrink">{miniCalendar}</div>
                {myCalendarsList}
                {otherCalendarsList}
            </SidebarNav>
        </Sidebar>
    );
};

export default CalendarSidebar;
