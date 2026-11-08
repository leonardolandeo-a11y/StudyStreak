export const files = new Map();
export const Paths = { document: 'test://documents', cache: 'test://cache' };
export class Directory {
  constructor(parent, name) { this.uri = name === undefined ? (parent.uri ?? parent) : `${parent.uri ?? parent}/${name}`; }
  create() {}
  list() { return [...files.keys()].filter(key => key.startsWith(this.uri + '/')).map(key => new File(this, key.slice(this.uri.length + 1))); }
}
export class File {
  constructor(parent, name) { this.uri = name === undefined ? (parent.uri ?? parent) : `${parent.uri ?? parent}/${name}`; }
  get exists() { return files.has(this.uri); }
  get name() { return this.uri.split('/').at(-1); }
  get size() { return files.get(this.uri)?.byteLength ?? 0; }
  create() {}
  delete() { files.delete(this.uri); }
  async text() { return files.get(this.uri); }
  async arrayBuffer() { const value = files.get(this.uri); if (value instanceof ArrayBuffer) return value; if (ArrayBuffer.isView(value)) return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength); throw new Error('Fixture file missing'); }
  write(value) { files.set(this.uri, value); }
  async move(destination) { files.set(destination.uri, files.get(this.uri)); files.delete(this.uri); this.uri = destination.uri; }
}
