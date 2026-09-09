export function formatAuthError(err: any, isSignUp = false): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const code = typeof err === 'string' ? err : err?.code || '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return isSignUp
        ? 'Email registration is currently not enabled in Firebase Console.'
        : 'Email authentication is currently not enabled in Firebase Console.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    default:
      if (err.message && typeof err.message === 'string') {
        // Strip raw "Firebase: Error (auth/...)" prefix if present
        const cleanMsg = err.message
          .replace(/^Firebase:\s*(Error\s*)?(\(auth\/[^)]+\)\.?\s*)?/i, '')
          .trim();
        return cleanMsg || 'Authentication failed. Please verify your details and try again.';
      }
      return 'Authentication failed. Please verify your details and try again.';
  }
}
