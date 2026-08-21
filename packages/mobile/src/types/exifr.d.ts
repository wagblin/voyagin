// exifr's bundled type declarations claim `gps()` always resolves to a `GpsOutput`, but in
// practice (and per exifr's own README/issues) it resolves `undefined` when the file has no GPS
// EXIF tags — exactly the scenario this app treats as "no location metadata", not an error.
declare module 'exifr' {
  interface GpsOutput {
    latitude: number;
    longitude: number;
  }

  interface ParseOutput {
    DateTimeOriginal?: Date;
    [tag: string]: unknown;
  }

  export function gps(data: unknown): Promise<GpsOutput | undefined>;
  export function parse(data: unknown): Promise<ParseOutput | undefined>;
}
