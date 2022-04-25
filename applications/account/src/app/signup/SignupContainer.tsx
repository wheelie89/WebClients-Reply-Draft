import { useEffect, useRef, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { checkReferrer } from '@proton/shared/lib/api/core/referrals';
import {
    APP_NAMES,
    APPS,
    BRAND_NAME,
    CLIENT_TYPES,
    CYCLE,
    DEFAULT_CURRENCY,
    PLANS,
    SSO_PATHS,
} from '@proton/shared/lib/constants';
import { getPaymentMethodStatus, queryPlans } from '@proton/shared/lib/api/payments';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { c } from 'ttag';
import {
    Api,
    Currency,
    Cycle,
    HumanVerificationMethodType,
    PaymentMethodStatus,
    Plan,
} from '@proton/shared/lib/interfaces';
import {
    ButtonLike,
    FeatureCode,
    HumanVerificationSteps,
    OnLoginCallback,
    useApi,
    useErrorHandler,
    useFeature,
    useLoading,
    useLocalState,
    useMyLocation,
    useVPNCountriesCount,
    useVPNServersCount,
} from '@proton/components';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';

import { getAppName } from '@proton/shared/lib/apps/helper';
import {
    InviteData,
    PlanIDs,
    SIGNUP_STEPS,
    SignupActionResponse,
    SignupCacheResult,
    SignupModel,
    SignupType,
    SubscriptionData,
} from './interfaces';
import { DEFAULT_SIGNUP_MODEL } from './constants';
import { defaultPersistentKey, getHasAppExternalSignup } from '../public/helper';
import SignupSupportDropdown from './SignupSupportDropdown';
import Layout from '../public/Layout';
import {
    handleCreateAccount,
    handleDisplayName,
    handleDone,
    handleHumanVerification,
    handlePayment,
    handleSaveRecovery,
    handleSelectPlan,
    handleSetupUser,
} from './signupActions';
import { getPlanIDsFromParams, getSignupSearchParams, SignupParameters } from './searchParams';
import { getPlanFromPlanIDs, getSubscriptionPrices } from './helper';
import AccountStep from './AccountStep';
import RecoveryStep from './RecoveryStep';
import ReferralStep from './ReferralStep';
import UpsellStep from './UpsellStep';
import LoadingStep from './LoadingStep';
import CongratulationsStep from './CongratulationsStep';
import PaymentStep from './PaymentStep';
import VerificationStep from './VerificationStep';
import ExploreStep from './ExploreStep';

const {
    ACCOUNT_CREATION_USERNAME,
    NO_SIGNUP,
    SAVE_RECOVERY,
    CONGRATULATIONS,
    UPSELL,
    TRIAL_PLAN,
    PAYMENT,
    HUMAN_VERIFICATION,
    CREATING_ACCOUNT,
    EXPLORE,
} = SIGNUP_STEPS;

interface Props {
    onLogin: OnLoginCallback;
    toApp?: APP_NAMES;
    toAppName?: string;
    onBack?: () => void;
    clientType: CLIENT_TYPES;
}

const SignupContainer = ({ toApp, toAppName, onBack, onLogin, clientType }: Props) => {
    const normalApi = useApi();
    const history = useHistory();
    const location = useLocation<{ invite?: InviteData }>();
    const [signupParameters] = useState(() => {
        return getSignupSearchParams(location.search);
    });
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const ignoreHumanApi = <T,>(config: any) =>
        silentApi<T>({
            ...config,
            ignoreHandler: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
        });
    const [myLocation] = useMyLocation();
    const [vpnCountries] = useVPNCountriesCount();
    const [vpnServers] = useVPNServersCount();
    const [loading, withLoading] = useLoading();
    const externalSignupFeature = useFeature(FeatureCode.ExternalSignup);
    const mailAppName = getAppName(APPS.PROTONMAIL);
    const [[steps, step], setStep] = useState<[SIGNUP_STEPS[], SIGNUP_STEPS]>([
        [],
        SIGNUP_STEPS.ACCOUNT_CREATION_USERNAME,
    ]);
    const [humanVerificationStep, setHumanVerificationStep] = useState(HumanVerificationSteps.ENTER_DESTINATION);

    const errorHandler = useErrorHandler();
    const cacheRef = useRef<SignupCacheResult | undefined>(undefined);

    const [persistent] = useLocalState(true, defaultPersistentKey);

    const [model, setModel] = useState<SignupModel>(DEFAULT_SIGNUP_MODEL);

    const setModelDiff = (diff: Partial<SignupModel>) => {
        return setModel((model) => ({
            ...model,
            ...diff,
        }));
    };

    useEffect(() => {
        const getSubscriptionData = async (
            api: Api,
            plans: Plan[],
            signupParameters: SignupParameters
        ): Promise<SubscriptionData> => {
            const planIDs = getPlanIDsFromParams(plans, signupParameters);
            const checkResult = await getSubscriptionPrices(
                api,
                planIDs || {},
                signupParameters.currency,
                signupParameters.cycle,
                signupParameters.coupon
            );
            return {
                cycle: signupParameters.cycle,
                currency: signupParameters.currency,
                checkResult,
                planIDs: planIDs || {},
                skipUpsell: !!planIDs,
            };
        };

        const fetchDependencies = async () => {
            const { referrer, invite } = signupParameters;

            const [{ Domains: domains }, paymentMethodStatus, referralData, Plans] = await Promise.all([
                normalApi<{ Domains: string[] }>(queryAvailableDomains('signup')),
                silentApi<PaymentMethodStatus>(getPaymentMethodStatus()),
                referrer
                    ? await silentApi(checkReferrer(referrer))
                          .then(() => ({
                              referrer: referrer || '',
                              invite: invite || '',
                          }))
                          .catch(() => undefined)
                    : undefined,
                silentApi<{ Plans: Plan[] }>(
                    queryPlans({
                        Currency: DEFAULT_CURRENCY,
                    })
                ).then(({ Plans }) => Plans),
            ]);

            if (location.pathname === SSO_PATHS.REFER && !referralData) {
                history.replace(SSO_PATHS.SIGNUP);
            }

            const subscriptionData = await getSubscriptionData(silentApi, Plans, signupParameters);

            setModelDiff({
                domains,
                plans: Plans,
                paymentMethodStatus,
                referralData,
                subscriptionData,
                inviteData: location.state?.invite,
            });
        };

        withLoading(
            fetchDependencies().catch(() => {
                setStep([[], NO_SIGNUP]);
            })
        );

        return () => {
            cacheRef.current = undefined;
        };
    }, []);

    const handleBack = () => {
        if (!steps.length) {
            return;
        }
        const newSteps = [...steps];
        const newStep = newSteps.pop()!;
        setStep([newSteps, newStep]);
    };

    const handleStep = (to: SIGNUP_STEPS) => {
        setStep([[...steps, step], to]);
    };

    const handleResult = (result: SignupActionResponse) => {
        if (result.to === SIGNUP_STEPS.DONE) {
            return onLogin(result.session);
        }
        cacheRef.current = result.cache;
        handleStep(result.to);
    };
    const handleError = (error: any) => {
        errorHandler(error);
    };

    const cache = cacheRef.current;

    if (step === NO_SIGNUP) {
        throw new Error('Missing dependencies');
    }

    const hasAppExternalSignup = externalSignupFeature.feature?.Value && getHasAppExternalSignup(toApp);

    const defaultCountry = myLocation?.Country?.toUpperCase();

    const handleChangeCurrency = async (currency: Currency) => {
        const checkResult = await getSubscriptionPrices(
            silentApi,
            model.subscriptionData.planIDs,
            currency,
            model.subscriptionData.cycle,
            model.subscriptionData.checkResult.Coupon?.Code
        );
        setModelDiff({
            subscriptionData: {
                ...model.subscriptionData,
                currency,
                checkResult,
            },
        });
    };

    const handleChangeCycle = async (cycle: Cycle) => {
        const checkResult = await getSubscriptionPrices(
            silentApi,
            model.subscriptionData.planIDs,
            model.subscriptionData.currency,
            cycle,
            model.subscriptionData.checkResult.Coupon?.Code
        );
        setModelDiff({
            subscriptionData: {
                ...model.subscriptionData,
                cycle,
                checkResult,
            },
        });
    };

    const handleChangePlanIDs = async (planIDs: PlanIDs) => {
        const checkResult = await getSubscriptionPrices(
            silentApi,
            planIDs,
            model.subscriptionData.currency,
            model.subscriptionData.cycle,
            model.subscriptionData.checkResult.Coupon?.Code
        );
        setModelDiff({
            subscriptionData: {
                ...model.subscriptionData,
                planIDs,
                checkResult,
            },
        });
    };

    const handlePlanSelectionCallback = async (subscriptionDataDiff: Partial<SubscriptionData>) => {
        if (!cache) {
            throw new Error('Missing cache');
        }
        const subscriptionData = {
            ...model.subscriptionData,
            ...subscriptionDataDiff,
        };
        setModelDiff({
            subscriptionData,
        });
        return handleSelectPlan({ cache, api: ignoreHumanApi, subscriptionData }).then(handleResult).catch(handleError);
    };

    const planName = getPlanFromPlanIDs(model.plans, model.subscriptionData.planIDs)?.Title;
    const verificationModel = cache?.humanVerificationResult?.verificationModel;

    const handleBackStep = (() => {
        if (step === ACCOUNT_CREATION_USERNAME) {
            return onBack && !model.referralData ? onBack : undefined;
        }
        if (step === HUMAN_VERIFICATION) {
            return () => {
                if (humanVerificationStep === HumanVerificationSteps.ENTER_DESTINATION) {
                    handleBack();
                } else {
                    setHumanVerificationStep(HumanVerificationSteps.ENTER_DESTINATION);
                }
            };
        }
        if ([PAYMENT, UPSELL, TRIAL_PLAN, SAVE_RECOVERY].includes(step)) {
            return handleBack;
        }
    })();

    const signupType =
        clientType === CLIENT_TYPES.VPN || toApp === APPS.PROTONVPN_SETTINGS ? SignupType.VPN : SignupType.Username;
    const upsellPlanName = signupType === SignupType.VPN ? PLANS.VPN : PLANS.BUNDLE;

    const accountData = cache?.accountData;

    const children = (
        <>
            {step === ACCOUNT_CREATION_USERNAME && (
                <AccountStep
                    onBack={handleBackStep}
                    title={(() => {
                        if (model.referralData) {
                            return c('Title').t`You’ve been invited to try ${mailAppName}`;
                        }
                        return c('Title').t`Create your ${BRAND_NAME} Account`;
                    })()}
                    subTitle={(() => {
                        if (model.referralData) {
                            return c('Title').t`Secure email based in Switzerland`;
                        }
                        if (toAppName) {
                            return c('Info').t`to continue to ${toAppName}`;
                        }
                        return c('Info').t`One account for all ${BRAND_NAME} services.`;
                    })()}
                    defaultEmail={accountData?.email}
                    defaultUsername={accountData?.username}
                    defaultSignupType={accountData?.signupType || signupType}
                    defaultRecovery={(accountData?.signupType === SignupType.VPN && accountData?.recoveryEmail) || ''}
                    domains={model.domains}
                    onSubmit={async ({ username, email, recoveryEmail, domain, password, signupType, payload }) => {
                        const accountData = {
                            username,
                            email,
                            password,
                            recoveryEmail,
                            signupType,
                            payload,
                            domain,
                        };
                        const subscriptionData = {
                            ...model.subscriptionData,
                        };
                        const cache: SignupCacheResult = {
                            toApp,
                            // Internal app or oauth app or vpn
                            ignoreExplore: Boolean(toApp || toAppName || signupType === SignupType.VPN),
                            generateKeys: clientType === CLIENT_TYPES.MAIL,
                            accountData,
                            subscriptionData,
                            inviteData: model.inviteData,
                            referralData: model.referralData,
                            persistent,
                            clientType,
                        };
                        return handleCreateAccount({
                            cache,
                            api: ignoreHumanApi,
                        })
                            .then(handleResult)
                            .catch(handleError);
                    }}
                    hasChallenge={!accountData?.payload || !Object.keys(accountData.payload).length}
                    hasExternalSignup={hasAppExternalSignup}
                    loading={loading || externalSignupFeature.loading}
                />
            )}
            {step === HUMAN_VERIFICATION && (
                <VerificationStep
                    onBack={handleBackStep}
                    defaultCountry={defaultCountry}
                    defaultEmail={accountData?.signupType === SignupType.VPN ? accountData.recoveryEmail : ''}
                    token={cache?.humanVerificationData?.token || ''}
                    methods={cache?.humanVerificationData?.methods || []}
                    step={humanVerificationStep}
                    onChangeStep={setHumanVerificationStep}
                    onClose={() => {
                        handleBack();
                    }}
                    onSubmit={(token: string, tokenType: HumanVerificationMethodType, verificationModel) => {
                        if (!cache) {
                            throw new Error('Missing cache');
                        }
                        return handleHumanVerification({
                            api: ignoreHumanApi,
                            verificationModel,
                            cache,
                            token,
                            tokenType,
                        })
                            .then(handleResult)
                            .catch((e) => {
                                handleError(e);
                                // Important this is thrown so that the human verification form can handle it
                                throw e;
                            });
                    }}
                />
            )}
            {step === TRIAL_PLAN && (
                <ReferralStep
                    onBack={handleBackStep}
                    onPlan={async (planIDs) => {
                        // Referral is always free even if there's a plan, and 1 month cycle
                        const cycle = CYCLE.MONTHLY;
                        const checkResult = getFreeCheckResult(model.subscriptionData.currency, cycle);
                        return handlePlanSelectionCallback({ checkResult, planIDs, cycle });
                    }}
                />
            )}
            {step === UPSELL && (
                <UpsellStep
                    onBack={handleBackStep}
                    currency={model.subscriptionData.currency}
                    cycle={model.subscriptionData.cycle}
                    plans={model.plans}
                    upsellPlanName={upsellPlanName}
                    onChangeCurrency={handleChangeCurrency}
                    vpnCountries={vpnCountries}
                    vpnServers={vpnServers}
                    onPlan={async (planIDs) => {
                        const checkResult = await getSubscriptionPrices(
                            silentApi,
                            planIDs,
                            model.subscriptionData.currency,
                            model.subscriptionData.cycle,
                            model.subscriptionData.checkResult.Coupon?.Code
                        );
                        return handlePlanSelectionCallback({ checkResult, planIDs });
                    }}
                />
            )}
            {step === PAYMENT && model.paymentMethodStatus && (
                <PaymentStep
                    onBack={handleBackStep}
                    api={normalApi}
                    paymentMethodStatus={model.paymentMethodStatus}
                    plans={model.plans}
                    planName={planName}
                    subscriptionData={model.subscriptionData}
                    onChangeCurrency={handleChangeCurrency}
                    onChangeCycle={handleChangeCycle}
                    onChangePlanIDs={handleChangePlanIDs}
                    onPay={(payment) => {
                        if (!cache) {
                            throw new Error('Missing cache');
                        }
                        const subscriptionData = {
                            ...model.subscriptionData,
                            payment,
                        };
                        return handlePayment({
                            api: silentApi,
                            cache,
                            subscriptionData,
                        })
                            .then(handleResult)
                            .catch(handleError);
                    }}
                />
            )}
            {step === CREATING_ACCOUNT && (
                <LoadingStep
                    hasPayment={
                        hasPlanIDs(model.subscriptionData.planIDs) && model.subscriptionData.checkResult.AmountDue > 0
                    }
                    onSetup={async () => {
                        if (!cache) {
                            throw new Error('Missing cache');
                        }
                        return handleSetupUser({ cache, api: silentApi })
                            .then(handleResult)
                            .catch((error) => {
                                handleBack();
                                handleError(error);
                            });
                    }}
                />
            )}
            {step === CONGRATULATIONS && (
                <CongratulationsStep
                    defaultName={cache?.accountData.username}
                    planName={planName}
                    onSubmit={({ displayName }) => {
                        if (!cache) {
                            throw new Error('Missing cache');
                        }
                        return handleDisplayName({
                            displayName,
                            cache,
                            api: silentApi,
                        })
                            .then(handleResult)
                            .catch(handleError);
                    }}
                />
            )}
            {step === SAVE_RECOVERY && (
                <RecoveryStep
                    onBack={handleBackStep}
                    defaultCountry={defaultCountry}
                    defaultEmail={verificationModel?.method === 'email' ? verificationModel?.value : ''}
                    defaultPhone={verificationModel?.method === 'sms' ? verificationModel?.value : ''}
                    onSubmit={({ recoveryEmail, recoveryPhone }) => {
                        if (!cache) {
                            throw new Error('Missing cache');
                        }
                        return handleSaveRecovery({ cache, api: silentApi, recoveryEmail, recoveryPhone })
                            .then(handleResult)
                            .catch(handleError);
                    }}
                />
            )}
            {step === EXPLORE && (
                <ExploreStep
                    onExplore={async (app) => {
                        if (!cache) {
                            throw new Error('Missing cache');
                        }
                        return handleDone({ cache, toApp: app }).then(handleResult).catch(handleError);
                    }}
                />
            )}
        </>
    );

    const loginLink = (
        <ButtonLike
            as={Link}
            className="ml0-5 text-semibold"
            color="norm"
            shape="outline"
            pill
            key="loginLink"
            to="/login"
        >{c('Link').t`Sign in`}</ButtonLike>
    );
    const hasDecoration = [ACCOUNT_CREATION_USERNAME].includes(step);
    return (
        <Layout
            hasBackButton={!!handleBackStep}
            topRight={
                hasDecoration && (
                    <div>
                        <div className="text-center">
                            <span className="no-tiny-mobile">{c('Info').t`Already have an account?`}</span>
                            <span>{loginLink}</span>
                        </div>
                    </div>
                )
            }
            bottomRight={<SignupSupportDropdown />}
            hasDecoration={hasDecoration}
        >
            {children}
        </Layout>
    );
};

export default SignupContainer;
