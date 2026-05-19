import {
  GLOBAL_HIGHLIGHT_SCOPE,
  getHighlightState,
  type HighlightState,
} from "@/lib/highlight-store";
import { getSessionUserId } from "@/lib/session";

export async function getHighlightScopeId(): Promise<string> {
  const userId = await getSessionUserId();
  return userId ?? GLOBAL_HIGHLIGHT_SCOPE;
}

/** User highlights first; fall back to extension global bucket. */
export async function getHighlightForSession(): Promise<HighlightState> {
  const userId = await getSessionUserId();
  if (userId) {
    const userState = await getHighlightState(userId);
    if (userState.text.trim()) {
      return userState;
    }
  }
  return getHighlightState(GLOBAL_HIGHLIGHT_SCOPE);
}
