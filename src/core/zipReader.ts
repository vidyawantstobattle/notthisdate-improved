// ===== MINIMAL ZIP READER =====
// Google Calendar hands out its export as a .zip, which phones can't easily
// unpack, so the upload accepts the archive directly. Only what's needed to
// pull text entries out is implemented, using the platform's own inflater
// (DecompressionStream) rather than pulling in a zip dependency.
//
// Nothing is written to disk and only entries the caller asks for are
// decompressed, so a hostile archive can at worst waste the size budget below.

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_FILE_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;

const METHOD_STORED = 0;
const METHOD_DEFLATE = 8;

// A zip bomb is the obvious abuse here, so the extracted total is capped
// regardless of what the archive claims.
const MAX_ENTRIES = 2000;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;

export class ZipError extends Error {
  readonly code: 'not_a_zip' | 'unsupported' | 'too_large' | 'corrupt';

  constructor(code: ZipError['code'], message: string) {
    super(message);
    this.name = 'ZipError';
    this.code = code;
  }
}

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

// The EOCD sits at the very end, after a comment of unknown length, so it has
// to be found by scanning backwards.
function findEndOfCentralDirectory(view: DataView): number {
  const maxCommentLength = 0xffff;
  const earliest = Math.max(0, view.byteLength - maxCommentLength - 22);

  for (let offset = view.byteLength - 22; offset >= earliest; offset--) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }

  throw new ZipError('not_a_zip', 'No end-of-central-directory record found');
}

function readCentralDirectory(view: DataView, bytes: Uint8Array): ZipEntry[] {
  const eocd = findEndOfCentralDirectory(view);
  const entryCount = view.getUint16(eocd + 10, true);
  const directoryOffset = view.getUint32(eocd + 16, true);

  if (entryCount > MAX_ENTRIES) {
    throw new ZipError('too_large', `Archive declares ${entryCount} entries`);
  }

  const entries: ZipEntry[] = [];
  let offset = directoryOffset;
  const decoder = new TextDecoder();

  for (let i = 0; i < entryCount; i++) {
    if (offset + 46 > view.byteLength || view.getUint32(offset, true) !== CENTRAL_FILE_SIGNATURE) {
      throw new ZipError('corrupt', 'Central directory entry is malformed');
    }

    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);

    entries.push({
      name: decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength)),
      method: view.getUint16(offset + 10, true),
      compressedSize: view.getUint32(offset + 20, true),
      uncompressedSize: view.getUint32(offset + 24, true),
      localHeaderOffset: view.getUint32(offset + 42, true)
    });

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

// The central directory records where the local header starts, but the data
// itself sits past that header's own variable-length name and extra fields.
function locateEntryData(view: DataView, entry: ZipEntry): { start: number; end: number } {
  const header = entry.localHeaderOffset;

  if (header + 30 > view.byteLength || view.getUint32(header, true) !== LOCAL_FILE_SIGNATURE) {
    throw new ZipError('corrupt', `Local header for "${entry.name}" is malformed`);
  }

  const nameLength = view.getUint16(header + 26, true);
  const extraLength = view.getUint16(header + 28, true);
  const start = header + 30 + nameLength + extraLength;
  const end = start + entry.compressedSize;

  if (end > view.byteLength) {
    throw new ZipError('corrupt', `Entry "${entry.name}" runs past the end of the archive`);
  }

  return { start, end };
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new ZipError('unsupported', 'This browser cannot unzip files');
  }

  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Reads every entry whose name matches `predicate` and decodes it as text.
 *
 * Only matching entries are decompressed, so an archive full of large
 * unrelated files costs nothing beyond reading its directory.
 */
export async function readTextEntries(
  buffer: ArrayBuffer,
  predicate: (name: string) => boolean
): Promise<{ name: string; text: string }[]> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  const entries = readCentralDirectory(view, bytes).filter(entry =>
    // Directory markers carry no content of their own.
    !entry.name.endsWith('/') && predicate(entry.name)
  );

  const results: { name: string; text: string }[] = [];
  const decoder = new TextDecoder();
  let totalBytes = 0;

  for (const entry of entries) {
    totalBytes += entry.uncompressedSize;
    if (totalBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new ZipError('too_large', 'Archive contents exceed the size limit');
    }

    const { start, end } = locateEntryData(view, entry);
    const raw = bytes.subarray(start, end);

    let content: Uint8Array;
    if (entry.method === METHOD_STORED) {
      content = raw;
    } else if (entry.method === METHOD_DEFLATE) {
      content = await inflateRaw(raw);
    } else {
      throw new ZipError('unsupported', `Entry "${entry.name}" uses compression method ${entry.method}`);
    }

    results.push({ name: entry.name, text: decoder.decode(content) });
  }

  return results;
}

export function looksLikeZip(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  // "PK\x03\x04" on a normal archive, "PK\x05\x06" when it is empty.
  const signature = new DataView(buffer).getUint32(0, true);
  return signature === LOCAL_FILE_SIGNATURE || signature === EOCD_SIGNATURE;
}
