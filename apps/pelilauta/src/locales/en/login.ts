import type { Locale } from 'src/utils/i18n';

export const login: Locale = {
  title: 'Sign In',
  info: "If you haven't signed in to Pelilauta before, we'll automatically create a new account for you.",
  withEmail: {
    title: 'With Link',
    info: "You can sign in to the application using your email address. Enter your email in the field below and click sign in. We'll send a magic link to your email that you can use to sign in to Pelilauta.",
    placeholder: 'Email address',
    sent: 'Link sent to your email. Sign in by clicking the link.',
    label: 'Sign in with your email address',
    sendAction: 'Send link',
  },
  withProvider: {
    title: 'With Account',
    info: 'Sign in to Pelilauta using one of the following services for authentication.',
  },
  withGoogle: {
    action: 'With Google account',
  },
  eula: {
    title: 'Welcome!',
    nickTaken: 'Username is already taken. Choose another.',
    profileInfo:
      "When you sign in to Pelilauta for the first time, we'll create a profile for you. With your profile, you can participate in discussions and share content with other users.",
    decline: 'Cancel and sign out',
    accept: 'Accept and continue',
    updateNotice: {
      title: 'Why am I seeing this?',
      description:
        'We have updated our privacy policies and terms of service with application version 16, and therefore we need to ask for your consent again for processing your data.',
    },
  },
  error: {
    credentialsRequired: 'Email and password are required.',
    invalidCredentials: 'Invalid email or password.',
    emailRequired: 'Email address is required.',
    provider: 'Sign in with {provider} failed.',
    linkVerificationFailed: 'Link verification failed.',
    sendLinkFailed: 'Failed to send link.',
  },
  snacks: {
    success: 'Sign in successful!',
  },
};
