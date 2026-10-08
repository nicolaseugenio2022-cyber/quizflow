/**
 * Cookie names that may carry a QuizFlow session. The proxy only checks for
 * presence to send anonymous visitors to sign-in early; the server-side role
 * gate still validates the session on every request.
 * PROVIDER PENDING: add the selected provider's session cookie here.
 */
export const DEV_SESSION_COOKIE = "quizflow_dev_session";

export const SESSION_COOKIE_NAMES: readonly string[] = [DEV_SESSION_COOKIE];
