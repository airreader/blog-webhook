export interface OgData {
  ogTitle: string | undefined,
  ogDescription: string | undefined,
  ogImageData: OgImageData | null
}

export interface OgImageData {
  blob: GoogleAppsScript.Base.Blob,
  size: number,
  contentType: string | null
}

export function getOgData(entryUrl: string): OgData {
  const response = UrlFetchApp.fetch(entryUrl);
  const content = response.getContentText();
  const ogTitleRegexp = /<meta property="og:title" content="(.*?)"\/>/;
  const ogImageRegexp = /<meta property="og:image" content="(.*?)"\/>/;
  const ogDescriptionRegexp = /<meta property="og:description" content="(.*?)" \/>/ 
  const ogTitle = content.match(ogTitleRegexp)?.[1];
  const ogImageUrl = content.match(ogImageRegexp)?.[1];
  const ogDescription = content.match(ogDescriptionRegexp)?.[1];
  const ogImageData = ogImageUrl ? fetchOgImageData(ogImageUrl) : null;
  return {
    ogTitle,
    ogDescription,
    ogImageData
  }
}

export function fetchOgImageData(imageUrl: string) {
  const response = UrlFetchApp.fetch(imageUrl);
  const blob = response.getBlob();
  const size = blob.getBytes().length;
  const contentType = blob.getContentType(); 
  return { blob, size, contentType }
}