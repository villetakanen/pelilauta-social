import type { Locale } from 'src/utils/i18n';

export const threads: Locale = {
  fork: {
    title: 'Fork as new thread',
    quoted: 'Quote',
    crossPost: 'Continued discussion in new thread ',
  },
  info: {
    title: 'Info',
    author: 'By',
    inTopic: 'in topic',
    replies: '{count} replies',
    createdAt: 'Created {time}',
    flowTime: 'Updated {time}',
    loveCount: '{count} likes',
    blueskyTitle: 'Bluesky',
    viewOnBluesky: 'View on Bluesky',
    actions: {
      title: 'Actions',
      admin: {
        title: 'Admin',
        repost: 'Repost',
      },
    },
  },
  edit: {
    title: 'Edit message',
  },
  quote: {
    fromThread: 'Quote from thread',
  },
  tray: {
    title: 'Topics',
  },
  forum: {
    title: 'Forum',
    description:
      'Discussion about role-playing games, game development, and other topics related to role-playing.',
  },
  channel: {
    page: 'Page',
    threadCount: '{count} threads',
    pageCount: 'Page {current}/{count}',
    toFirstPage: 'First page <',
    nextPage: '> Next page',
    latest: {
      createdAt: 'Latest thread',
      flowTime: 'Last updated',
      latestIsNewest: '(Latest comment is in newest thread)',
    },
    loadMore: 'Load More Threads',
    loading: 'Loading...',
    retry: 'Retry',
    error: 'Failed to load channel threads. Please try again later.',
    noMoreThreads: 'No more threads to load',
  },
  discussion: {
    title: 'Discussion',
    reply: 'Reply',
    empty: 'Start the discussion by replying below.',
    confirmDelete: {
      message: 'Are you sure you want to delete this message?',
    },
  },
  confirmDelete: {
    title: 'Confirm deletion',
    success: 'Thread deleted',
    error: 'Failed to delete thread',
    message:
      'Are you sure you want to permanently delete this thread? The thread cannot be restored.',
  },
  onboarding: {
    title: 'Welcome to Pelilauta!',
    description:
      'Pelilauta is a role-playing focused application where you can discuss, share and document role-playing games. By logging in, you can participate in discussions, react to messages and start new topics.',
  },
  snacks: {
    replyDeleted: 'Message deleted',
  },
  share: {
    description:
      'Share this thread to the Bluesky community and reach more players.',
    button: 'Share on Bluesky',
    sharing: 'Sharing...',
    success: 'Thread shared successfully! Page will refresh...',
    error: 'Error sharing',
  },
};
