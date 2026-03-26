/**
 * Origin Private File System (OPFS) Utility Engine
 * Provides high-performance, sandboxed local storage for large media files.
 */

export async function getOPFSRoot() {
  return await navigator.storage.getDirectory();
}

export async function saveFileToOPFS(file: File, path: string): Promise<FileSystemFileHandle> {
  const root = await getOPFSRoot();
  const fileHandle = await root.getFileHandle(path, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
  return fileHandle;
}

export async function getFileFromOPFS(path: string): Promise<File> {
  const root = await getOPFSRoot();
  const fileHandle = await root.getFileHandle(path);
  return await fileHandle.getFile();
}

export async function deleteFileFromOPFS(path: string) {
  const root = await getOPFSRoot();
  await root.removeEntry(path);
}

export async function listOPFSFiles(): Promise<string[]> {
  const root = await getOPFSRoot();
  const files: string[] = [];
  // @ts-ignore
  for await (const [name, handle] of root.entries()) {
    if (handle.kind === 'file') {
      files.push(name);
    }
  }
  return files;
}

export async function clearOPFS() {
  const root = await getOPFSRoot();
  // @ts-ignore
  for await (const [name] of root.entries()) {
    await root.removeEntry(name, { recursive: true });
  }
}
