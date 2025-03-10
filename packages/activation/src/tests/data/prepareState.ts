import {
    ImportProvider,
    ImportType,
    MailImportDestinationFolder,
    MailImportGmailCategories,
    TIME_PERIOD,
} from '@proton/activation/src/interface';
import { OauthDraftState } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.interface';

import { mockAddresses } from './addresses';

export const prepareState: OauthDraftState = {
    step: 'started',
    provider: ImportProvider.GOOGLE,
    mailImport: {
        step: 'prepare-import',
        products: [ImportType.MAIL, ImportType.CALENDAR, ImportType.CONTACTS],
        importerData: {
            importerId: 'importerId',
            importedEmail: 'easyflavien@gmail.com',
            emails: {
                fields: {
                    importAddress: mockAddresses[0],
                    importPeriod: TIME_PERIOD.LAST_3_MONTHS,
                    importCategoriesDestination: MailImportDestinationFolder.INBOX,
                    importLabel: {
                        Name: 'gmail.com 09-01-2023 09:34',
                        Color: '#3CBB3A',
                        Type: 1,
                    },
                    mapping: [
                        {
                            id: 'Inbox',
                            providerPath: ['Inbox'],
                            checked: true,
                            color: '#B4A40E',
                            folderParentID: undefined,
                            systemFolder: MailImportDestinationFolder.INBOX,
                            isSystemFolderChild: false,
                            category: undefined,
                            folderChildIDS: [],
                            protonPath: ['Inbox'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'Forums',
                            providerPath: ['Forums'],
                            category: MailImportGmailCategories.FORUMS,
                            checked: true,
                            folderParentID: undefined,
                            color: '#DB60D6',
                            systemFolder: MailImportDestinationFolder.INBOX,
                            isSystemFolderChild: false,
                            folderChildIDS: [],
                            protonPath: ['Forums'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'Updates',
                            providerPath: ['Updates'],
                            category: MailImportGmailCategories.UPDATES,
                            checked: true,
                            color: '#A839A4',
                            folderParentID: undefined,
                            systemFolder: MailImportDestinationFolder.INBOX,
                            isSystemFolderChild: false,
                            folderChildIDS: [],
                            protonPath: ['Updates'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'Promotions',
                            providerPath: ['Promotions'],
                            category: MailImportGmailCategories.PROMOTIONS,
                            checked: true,
                            color: '#5252CC',
                            folderParentID: undefined,
                            systemFolder: MailImportDestinationFolder.INBOX,
                            isSystemFolderChild: false,
                            folderChildIDS: [],
                            protonPath: ['Promotions'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'Social',
                            providerPath: ['Social'],
                            category: MailImportGmailCategories.SOCIAL,
                            checked: true,
                            color: '#B4A40E',
                            folderParentID: undefined,
                            systemFolder: MailImportDestinationFolder.INBOX,
                            isSystemFolderChild: false,
                            folderChildIDS: [],
                            protonPath: ['Social'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'Sent',
                            providerPath: ['Sent'],
                            checked: true,
                            color: '#5252CC',
                            category: undefined,
                            folderParentID: undefined,
                            systemFolder: MailImportDestinationFolder.SENT,
                            isSystemFolderChild: false,
                            folderChildIDS: [],
                            protonPath: ['Sent'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'Drafts',
                            providerPath: ['Drafts'],
                            checked: true,
                            color: '#DB60D6',
                            category: undefined,
                            folderParentID: undefined,
                            systemFolder: MailImportDestinationFolder.DRAFTS,
                            isSystemFolderChild: false,
                            folderChildIDS: [],
                            protonPath: ['Drafts'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'Starred',
                            providerPath: ['Starred'],
                            checked: true,
                            color: '#5252CC',
                            category: undefined,
                            folderParentID: undefined,
                            systemFolder: MailImportDestinationFolder.STARRED,
                            isSystemFolderChild: false,
                            folderChildIDS: [],
                            protonPath: ['Starred'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'Important',
                            providerPath: ['Important'],
                            checked: true,
                            color: '#8080FF',
                            folderChildIDS: [],
                            category: undefined,
                            systemFolder: undefined,
                            isSystemFolderChild: false,
                            folderParentID: undefined,
                            protonPath: ['Important'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'Schedule',
                            providerPath: ['Schedule'],
                            checked: true,
                            color: '#1DA583',
                            folderChildIDS: [],
                            category: undefined,

                            systemFolder: undefined,
                            isSystemFolderChild: false,
                            folderParentID: undefined,
                            protonPath: ['Schedule'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'test',
                            providerPath: ['test'],
                            checked: true,
                            color: '#807304',
                            category: undefined,

                            systemFolder: undefined,
                            isSystemFolderChild: false,
                            folderParentID: undefined,
                            folderChildIDS: ['test/Schedule', 'test/Schedule/hello', 'test/Scheduled'],
                            protonPath: ['test'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'test/Schedule',
                            providerPath: ['test', 'Schedule'],
                            checked: true,
                            color: '#807304',
                            category: undefined,

                            systemFolder: undefined,
                            isSystemFolderChild: false,
                            folderParentID: undefined,
                            folderChildIDS: ['test/Schedule/hello'],
                            protonPath: ['test-Schedule'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'test/Schedule/hello',
                            providerPath: ['test', 'Schedule', 'hello'],
                            checked: true,
                            color: '#807304',
                            folderChildIDS: [],
                            category: undefined,

                            systemFolder: undefined,
                            isSystemFolderChild: false,
                            folderParentID: 'test/Schedule',
                            protonPath: ['test-Schedule-hello'],
                            separator: '/',
                            size: 0,
                        },
                        {
                            id: 'test/Scheduled',
                            providerPath: ['test', 'Scheduled'],
                            checked: true,
                            color: '#807304',
                            folderChildIDS: [],
                            category: undefined,

                            systemFolder: undefined,
                            isSystemFolderChild: false,
                            folderParentID: 'test',
                            protonPath: ['test-Scheduled'],
                            separator: '/',
                            size: 0,
                        },
                    ],
                },
            },
            calendars: {
                calendars: [
                    {
                        id: 'easyflavien@gmail.com',
                        source: 'easyflavien@gmail.com',
                        description: '',
                        checked: true,
                    },
                    {
                        id: '5245558e2814165719009b25011d988f038c0d7ab37e1509cb7641e5f893f6f5@group.calendar.google.com',
                        source: 'Agenda temp',
                        description: '',
                        checked: true,
                    },
                    {
                        id: '571814dc052c54d2dda066ea0694ea43658b395dbc46d7c4bdcedea8aa91a958@group.calendar.google.com',
                        source: 'Meeting',
                        description: 'test',
                        checked: true,
                    },
                ],
            },
            contacts: {
                numContact: 100,
                numGroups: 1,
            },
        },
    },
};
