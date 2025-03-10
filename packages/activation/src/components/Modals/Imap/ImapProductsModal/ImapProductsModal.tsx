import React from 'react';

import { c } from 'ttag';

import { EasySwitchFeatureFlag, ImportType } from '@proton/activation/src/interface';
import { FeatureCode, Loader, ModalTwo, ModalTwoContent, ModalTwoHeader, useFeature } from '@proton/components';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

import useUserCalendars from '../../../../hooks/useUserCalendars';
import ImapProductsModalButtons from './ImapProductsModalButtons';

interface Props {
    onClick: (importType: ImportType) => void;
    onClose: () => void;
}

const ImapProductsModal = ({ onClick, onClose }: Props) => {
    const { feature, loading: FFLoading } = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const [userActiveCalendars, calendarLoading] = useUserCalendars();
    const loading = FFLoading || calendarLoading;

    return (
        <ModalTwo
            key="easy-switch-imap-modal"
            className="easy-switch-modal"
            size="large"
            open
            onClose={onClose}
            data-testid="MailModal:ProductModal"
        >
            <ModalTwoHeader title={c('Title').t`What would you like to import?`} />
            <ModalTwoContent className="mb2">
                {loading ? (
                    <Loader />
                ) : (
                    <div>
                        <div className="mb2">{c('Info').t`You can import one data type at a time.`}</div>
                        <div className="import-buttons">
                            <ImapProductsModalButtons
                                importType={ImportType.MAIL}
                                onClick={() => onClick(ImportType.MAIL)}
                                disabled={!feature?.Value?.OtherMail}
                                disabledTooltipTitle={c('Info').t`Temporarily unavailable. Please check back later.`}
                            />
                            <ImapProductsModalButtons
                                importType={ImportType.CALENDAR}
                                onClick={() => onClick(ImportType.CALENDAR)}
                                disabled={!feature?.Value?.OtherCalendar || userActiveCalendars.length === 0}
                                disabledTooltipTitle={
                                    feature?.Value?.OtherCalendar
                                        ? c('Info')
                                              .t`To import events, first create a calendar in ${CALENDAR_APP_NAME}. This is where the events will appear after the import.`
                                        : c('Info').t`Temporarily unavailable. Please check back later.`
                                }
                            />
                            <ImapProductsModalButtons
                                importType={ImportType.CONTACTS}
                                onClick={() => onClick(ImportType.CONTACTS)}
                                disabled={!feature?.Value?.OtherContacts}
                                disabledTooltipTitle={c('Info').t`Temporarily unavailable. Please check back later.`}
                            />
                        </div>
                    </div>
                )}
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default ImapProductsModal;
