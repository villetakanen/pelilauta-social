import type { Locale } from 'src/utils/i18n';

export const admin: Locale = {
  title: 'Forum Administration',
  description:
    'Manage forum channels and topics. Create new channels, refresh statistics, and organize forum structure.',
  shortcuts: {
    refreshAll: 'Refresh All',
    addChannel: 'Add Channel',
    addTopic: 'Add Topic',
  },
  channels: {
    title: 'Channels',
    addChannel: 'Add Channel',
    refreshAll: 'Refresh All',
    add: {
      title: 'Add New Channel',
      shortTitle: 'Add Channel',
      description:
        'Create a new forum channel with a name, topic category, and icon. The channel will be available immediately after creation.',
      form: {
        name: 'Channel Name',
        namePlaceholder: 'Enter channel name',
        nameRequired: 'Name and category are required.',
        category: 'Topic Category',
        categoryPlaceholder: 'Select a category',
        categoryRequired: 'Topic Category',
        categoryEmpty: 'No categories available',
        categoryEmptyHelper:
          'No topic categories found. Create a topic first in the main channels admin page.',
        icon: 'Icon',
        iconPlaceholder: 'Choose an icon...',
        iconHelper: "Select an icon that represents the channel's purpose",
        urlSlugPrefix: 'URL slug:',
        actions: {
          cancel: 'Cancel',
          reset: 'Reset Form',
          create: 'Create Channel',
        },
      },
      guidelines: {
        title: 'Channel Guidelines',
        items: {
          unique: 'Channel names should be descriptive and unique',
          category: 'Choose an appropriate topic category from existing topics',
          icon: "Select an icon that represents the channel's purpose",
          slug: 'Channel slugs are automatically generated from names',
        },
      },
      success: 'Channel "{name}" created successfully! Redirecting...',
    },
    noChannels: {
      title: 'No Channels Found',
      description: 'Create your first channel to get started.',
    },
    loading: 'Loading channels...',
    actions: {
      edit: 'Edit',
      delete: 'Delete',
      refresh: 'Refresh statistics',
    },
    delete: {
      confirm: 'DELETE CHANNEL',
      warning: 'This will permanently delete the channel.',
      details: {
        threads: 'Current threads',
        category: 'Category',
      },
      cannotUndo: 'This action cannot be undone!',
      typeToConfirm: 'Type the channel name to confirm deletion:',
      namePrompt: 'Please type "{name}" to confirm deletion:',
      nameMismatch: 'Channel name does not match. Deletion cancelled.',
      hasThreads:
        'Cannot delete channel with existing threads. Move or delete threads first.',
      success: 'Channel deleted successfully',
      failed: 'Failed to delete channel',
      confirmText: 'Are you sure you want to delete this channel?',
    },
    edit: {
      namePrompt: 'Edit channel name (current: "{current}"):',
      success: 'Channel updated successfully',
      failed: 'Failed to update channel',
      name: 'Channel Name',
      characters: 'characters',
      tooLong:
        'exceeds recommended length, will be truncated in search engines',
    },
    create: {
      success: 'Channel "{name}" created successfully',
      failed: 'Failed to create channel',
    },
    refresh: {
      success: 'Channel statistics refreshed',
      allSuccess: 'All channel statistics refreshed',
      failed: 'Failed to refresh channel statistics',
    },
  },
  topics: {
    addTopic: 'Add Topic',
    create: {
      title: 'Create New Topic',
      name: 'Topic Name',
      placeholder: 'Enter topic name',
      slugPreview: 'URL will be generated automatically',
      description: 'Topics help organize channels into logical groups.',
      save: 'Create Topic',
      success: 'Topic "{name}" created successfully',
      failed: 'Failed to create topic',
    },
    moveUp: 'Move topic up',
    moveDown: 'Move topic down',
    delete: 'Delete topic',
    deleteDisabled: 'Cannot delete topic with channels',
  },
  errors: {
    loadFailed: 'Failed to load channels',
    retry: 'Retry',
  },
  labels: {
    title: 'Admin Labels',
    addLabel: 'Add Label',
    addPlaceholder: 'Enter label name',
    noLabels: 'No admin labels assigned',
    removeLabel: 'Remove label',
    legend: 'Labels are admin-assigned tags that persist through edits',
    success: {
      added: 'Label "{label}" added',
      removed: 'Label "{label}" removed',
    },
    errors: {
      addFailed: 'Failed to add label',
      removeFailed: 'Failed to remove label',
      emptyLabel: 'Label cannot be empty',
      alreadyExists: 'Label "{label}" already exists',
    },
  },
};
