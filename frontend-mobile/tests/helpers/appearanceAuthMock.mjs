export const authCalls={signOut:0};
export function useAuth() {
  return { currentUser: { id: 1, username: 'student', email: 'student@example.invalid' },
    signOut: async () => {authCalls.signOut++;}, signIn: async () => {}, signUp: async () => {}, isLoading: false,
    sessionRestoreError: false, retrySession: async () => {} };
}
