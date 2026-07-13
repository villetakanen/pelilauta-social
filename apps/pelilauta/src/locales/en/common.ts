import type { Locale } from 'src/utils/i18n';

export const common: Locale = {
  error: {
    generic: 'An unexpected error occurred. Please try again.',
    networkError: 'Network error. Please check your internet connection.',
    unauthorized: 'You do not have permission for this action.',
    notFound: 'The requested content was not found.',
    serverError: 'Server error. Please try again later.',
  },
  success: {
    saved: 'Saved successfully.',
    deleted: 'Deleted successfully.',
    updated: 'Updated successfully.',
  },
  action: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    loading: 'Loading...',
  },
};
