// A 403 means the record is readable, but its validation belongs to someone else.
export function validationLookupState(status?: number): 'missing' | 'forbidden' | 'unavailable' {
  if (status === 404) return 'missing';
  if (status === 403) return 'forbidden';
  return 'unavailable';
}

// A partner's goal cannot be opened through the current user's own-goal screen.
export function reviewedRecordExit(reviewRequested: boolean): 'validations' | 'goal' {
  return reviewRequested ? 'validations' : 'goal';
}
