import { act, fireEvent, render } from '@testing-library/react';

import { External } from '@proton/shared/lib/interfaces';

import InAppPurchaseModal from './InAppPurchaseModal';

jest.mock('@proton/components/components/portal/Portal');

it('should render', () => {
    const { container } = render(
        <InAppPurchaseModal open={true} subscription={{ External: External.Android } as any} onClose={() => {}} />
    );

    expect(container).toHaveTextContent(
        `Your subscription has been done via an in-app purchase. To manage your current subscription you need to navigate to the Subscription section on your Google Play store account`
    );
});

it('should trigger onClose when user presses the button', async () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
        <InAppPurchaseModal onClose={onClose} open={true} subscription={{ External: External.Android } as any} />
    );

    await act(async () => {
        fireEvent.click(getByTestId('InAppPurchaseModal/onClose'));
    });

    expect(onClose).toHaveBeenCalled();
});

it('should render iOS text if subscription is managed by Apple', async () => {
    const onClose = jest.fn();
    const { container } = render(
        <InAppPurchaseModal onClose={onClose} open={true} subscription={{ External: External.iOS } as any} />
    );

    expect(container).toHaveTextContent('Apple App Store');
    expect(container).not.toHaveTextContent('Google');
    expect(container).not.toHaveTextContent('Google Play');
});

it('should immediately close if subscription is not managed externally', () => {
    const onClose = jest.fn();
    const { container } = render(
        <InAppPurchaseModal onClose={onClose} open={true} subscription={{ External: External.Default } as any} />
    );

    expect(onClose).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
});
