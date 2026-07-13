import type { Locale } from 'src/utils/i18n';

export const entries: Locale = {
  account: {
    lastLogin: 'Last login',
    lightMode: 'Dark mode',
    uid: 'UID',
    updatedAt: 'Updated',
    showAdminTools: 'Show admin tools',
    language: 'Language',
  },
  assets: {
    name: 'Name',
    description: 'Description',
    license: 'License',
  },
  handout: {
    title: 'Title',
  },
  profile: {
    uid: 'Identifier',
    nick: 'Nick',
    avatar: 'Avatar',
    bio: 'Description',
    username: 'Username',
  },
  site: {
    key: 'Key',
    name: 'Name',
    description: 'Description',
    system: 'Game, system or category',
    homePage: 'Home page',
    flowTime: 'Modified',
    sortOrder: 'Page order',
    sortOrders: {
      name: 'Alphabetical',
      createdAt: 'By creation time',
      flowTime: 'By modification time',
      manual: 'Manual order',
    },
    avatarURL: 'Icon',
    posterURL: 'Cover image',
    backgroundURL: 'Background image',
    hidden: 'Hidden site',
    customPageKeys: 'Custom addresses',
    placeholders: {
      name: 'Site or game name',
      description: 'Site description. Will be copied as homepage text.',
    },
  },
  thread: {
    title: 'Title',
    channel: 'Topic',
    placeholders: {
      title: 'Title',
      content: 'Message...',
    },
    meta: {
      entryName: 'Message',
      entryNamePlural: 'Messages',
    },
  },
  reply: {
    placeholders: {
      markdownContent: 'Write a message...',
    },
  },
  default: 'Default',
  page: {
    name: 'Page name',
    category: 'Category',
    markdownContent: 'Markdown',
    defaults: {
      name: '[Page name]',
      category: '-',
    },
  },
  clock: {
    label: 'Clock title',
    tickIndex: 'Step',
    tickSize: 'Size',
    ticks: 'Steps',
  },
  character: {
    name: 'Name',
    description: 'Description',
    site: 'Game / Site',
    placeholders: {
      name: 'e.g. Gandalf the Grey',
      description: 'Character description or backstory...',
    },
    sheet: 'Character sheet',
  },
};
