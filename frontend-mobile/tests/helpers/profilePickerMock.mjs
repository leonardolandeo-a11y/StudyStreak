export const UIImagePickerPreferredAssetRepresentationMode = { Compatible: 'compatible' };
let result = { canceled: true, assets: null };
let failure = null;
export const requests = [];
export function setPickerResult(value) { result = value; failure = null; }
export function setPickerFailure(error) { failure = error; }
export async function launchImageLibraryAsync(options) { requests.push(options); if (failure) throw failure; return result; }
