export interface Tag { id: number; name: string; }
export interface TagRequest { name: string; }
export function tagNameError(value: string): string | null {
  const name = value.trim();
  return !name ? 'Tag name is required.' : name.length > 50 ? 'Tag name cannot exceed 50 characters.' : null;
}
