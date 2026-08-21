const UPLOAD_SEGMENT = '/upload/';

export function cloudinaryThumbnailUrl(url: string, width: number): string {
  const uploadIndex = url.indexOf(UPLOAD_SEGMENT);
  if (uploadIndex === -1) {
    return url;
  }

  const insertPosition = uploadIndex + UPLOAD_SEGMENT.length;
  const transformation = `w_${width},c_limit,q_auto,f_auto/`;

  return url.slice(0, insertPosition) + transformation + url.slice(insertPosition);
}
