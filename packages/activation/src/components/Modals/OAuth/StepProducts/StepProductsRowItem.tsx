import { ReactNode } from 'react';

import { c } from 'ttag';

import { Checkbox, Label } from '@proton/components';
import clsx from '@proton/utils/clsx';

import StepPrepareDisabledCheckbox from '../StepPrepareOAuth/StepPrepareOAuthDisabledCheckbox';

interface Props {
    id: 'mail' | 'contact' | 'calendar';
    label: string;
    disabled?: boolean;
    value: boolean;
    setValue: (value: boolean) => void;
    error?: string;
    children?: ReactNode;
}

const StepProductsRowItem = ({ id, label, disabled, value, setValue, error, children }: Props) => {
    if (error) {
        return <StepPrepareDisabledCheckbox id={id}>{error}</StepPrepareDisabledCheckbox>;
    }

    return (
        <Label
            htmlFor={id}
            className={clsx(['pt1-5 pb1-5 border-bottom flex label w100', disabled && 'cursor-default color-weak'])}
        >
            <Checkbox
                id={id}
                checked={disabled ? false : value}
                onChange={(e) => setValue(e.target.checked)}
                className="mr0-5 flex-align-self-start"
                disabled={disabled}
            />
            <div className="flex flex-column flex-item-fluid">
                <div className={clsx(disabled && 'color-weak')}>
                    {label}
                    {disabled && (
                        <span className="block">
                            {c('Label').t`(Temporarily unavailable. Please check back later.)`}
                        </span>
                    )}
                </div>
                {children}
            </div>
        </Label>
    );
};

export default StepProductsRowItem;
