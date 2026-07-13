import type { Locale } from 'src/utils/i18n';

export const characters: Locale = {
  character: {
    title: 'Characters',
    description:
      'Characters are player-created game characters. They can contain information such as name, description, and character sheet.',
    markdown: 'General description',
  },
  confirmDeletion: {
    title: 'Delete character',
    description:
      'You are about to delete character "{characterName}". This action cannot be undone.',
    success: 'Character deleted successfully.',
    error: 'Failed to delete character. Please try again.',
  },
  create: {
    title: 'Create character',
    description: 'Select a character sheet template to use below.',
    noSheet: 'No character sheet (name and description only)',
    noSite: 'No site',
  },
  edit: {},
  snacks: {
    characterNotFound: 'Character not found.',
    changesSaved: 'Changes saved.',
    changesSaveFailed: 'Failed to save changes.',
    characterCreated: 'Character {name} created successfully.',
  },
  sheets: {
    editor: {
      info: {
        title: 'Sheet information',
      },
    },
    select: {
      label: 'Character sheet',
      none: 'No sheet',
      loading: 'Loading character sheets...',
      empty: 'No character sheets available.',
      'feature-flagged':
        'Character sheet support is experimental and not yet enabled.',
    },
    fields: {
      name: 'Sheet name',
    },
    placeholders: {
      name: 'e.g. D&D 5e Fighters',
    },
  },
  sites: {
    select: {
      description: 'Select your game or site that this character belongs to.',
      empty: 'You have no games or sites.',
    },
  },
};
