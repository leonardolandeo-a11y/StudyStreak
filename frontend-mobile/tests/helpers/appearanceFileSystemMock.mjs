export const files = new Map();
export const Paths = { document: 'test://documents' };
export class Directory {
  constructor(parent, name) { this.uri = `${parent.uri ?? parent}/${name}`; }
  create() {}
}
export class File {
  constructor(parent, name) { this.uri = `${parent.uri ?? parent}/${name}`; }
  get exists() { return files.has(this.uri); }
  async text() { return files.get(this.uri); }
  write(value) { files.set(this.uri, value); }
  async move(destination) { files.set(destination.uri, files.get(this.uri)); files.delete(this.uri); this.uri = destination.uri; }
}
