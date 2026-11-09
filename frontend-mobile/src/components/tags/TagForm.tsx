import { useState } from 'react';
import { View } from 'react-native';
import { FormField } from '../ui/FormField';
import { ActionButton } from '../ui/ActionButton';
import { StatusMessage } from '../ui/StatusMessage';
import { tagNameError, type TagRequest } from '../../types/tag';
export function TagForm({ initialName = '', busy, onSubmit, onCancel }: {
  initialName?: string; busy: boolean; onSubmit(value: TagRequest): Promise<boolean>; onCancel(): void;
}) {
  const [name,setName] = useState(initialName);
  const [error,setError] = useState<string | null>(null);
  return <View style={{ gap: 12 }}>
    <FormField variant="subtle" label="Tag name" value={name} onChangeText={setName} editable={!busy} maxLength={50}
      hint={`${name.length}/50 characters`} autoCapitalize="sentences" />
    {error ? <StatusMessage error message={error} /> : null}
    <ActionButton compact title="Save tag" busy={busy} onPress={() => {
      const invalid = tagNameError(name); setError(invalid); if (!invalid) void onSubmit({ name: name.trim() });
    }} />
    <ActionButton compact title="Cancel" secondary disabled={busy} onPress={onCancel} />
  </View>;
}
