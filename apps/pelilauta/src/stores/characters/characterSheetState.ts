import { atom } from 'nanostores';

export const isEditing = atom(false);
export const showSettingsPanel = atom(false);

export function toggleEditing() {
  isEditing.set(!isEditing.get());
}
