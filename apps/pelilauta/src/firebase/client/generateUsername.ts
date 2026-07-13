import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '.';

export async function generateUsername(displayName: string, email: string) {
  // username has to be a string, and locally unique.
  // we'll start with the displayname, and replace all whitespace with underscores
  let username = displayName || email.split('@')[0];

  username = username.replace(/\s/g, '');

  // we'll also lowercase the username
  username = username.toLowerCase();

  // we'll also remove all non-alphanumeric characters
  username = username.replace(/[^a-z0-9_]/g, '');

  // we'll also make sure the username is not empty
  if (username.length === 0) {
    username = 'sleeper_agent';
  }

  // finally, we'll check if the username is unique - if not, lets add a random number to the end and try again
  let usernameIsUnique = false;
  while (!usernameIsUnique) {
    const q = query(
      collection(db, 'profiles'),
      where('username', '==', username),
    );
    const docs = await getDocs(q);
    if (docs.size === 0) {
      usernameIsUnique = true;
    } else {
      //logDebug('Username', username, 'is not unique, trying again');
      username = username + Math.floor(Math.random() * 10);
    }
  }
  //logDebug('Generated username', username);
  return username;
}
