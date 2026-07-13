import { authedPost } from 'src/firebase/client/apiClient';
import type { Reactions } from 'src/schemas/ReactionsSchema';
import type { ReactionRequest } from '../../pages/api/reactions/index';

export type ToggleReactionRequest = ReactionRequest;

export interface ToggleReactionResponse {
  success: boolean;
  reactions?: Reactions;
  error?: string;
}

/**
 * Toggle a reaction (add if not present, remove if present) for the authenticated user.
 *
 * @param request - The reaction request containing key, type, target, and optional title
 * @returns Promise containing the updated reactions data or error information
 */
export async function toggleReaction(
  request: ToggleReactionRequest,
): Promise<ToggleReactionResponse> {
  try {
    const response = await authedPost('/api/reactions', request);

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `HTTP error! Status: ${response.status}`,
      };
    }

    const data = await response.json();
    return data as ToggleReactionResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
