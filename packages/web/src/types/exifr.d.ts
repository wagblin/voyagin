// This file has no top-level import/export, so it is parsed as a global script
// rather than a module: the `declare module 'exifr'` block below therefore
// replaces exifr's own type declarations instead of augmenting them, and every
// export we rely on from the library has to be re-declared here.
//
// exifr's own type declarations claim `gps()` always resolves a `GpsOutput`,
// but its README documents (and its runtime actually does) resolve `undefined`
// when the file has no GPS metadata: https://github.com/MikeKovarik/exifr#gpsfile
// This augmentation corrects that upstream mismatch.
//
// `parse()` resolves the full EXIF tag object (typed `any` upstream); we use a
// stricter `Record<string, unknown>` here so callers must narrow individual
// tags before using them.
declare module 'exifr' {
  type ExifrInput = ArrayBuffer | SharedArrayBuffer | Buffer | Uint8Array | DataView | string | Blob | File | HTMLImageElement

  interface GpsOutput {
    latitude: number
    longitude: number
  }

  export function gps(data: ExifrInput): Promise<GpsOutput | undefined>

  export function parse(data: ExifrInput, options?: unknown): Promise<Record<string, unknown> | undefined>
}
