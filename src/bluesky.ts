/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { OgImageData, type OgData } from "./og";

export function createBlueskyRequest(entryUrl: string, ogData: OgData): GoogleAppsScript.URL_Fetch.URLFetchRequest | undefined {
  const sp = PropertiesService.getScriptProperties();
  const useBluesky = sp.getProperty("useBluesky");
  const userId = sp.getProperty("blueskyId");
  const appPassword = sp.getProperty("blueskyAppPassword");
  if(useBluesky !== "true" || !userId || !appPassword) return;
  const accessJwt = createSession(userId, appPassword).accessJwt;
  return createRequest(userId, ogData, accessJwt, entryUrl);
}

function createSession(userId:string, appPassword:string) {
  const url = 'https://bsky.social/xrpc/com.atproto.server.createSession';
  const payload = {
    identifier: userId,
    password: appPassword
  };
  const method: GoogleAppsScript.URL_Fetch.HttpMethod = "post"
  const options = {
    contentType: "application/json",
    payload: JSON.stringify(payload),
    method
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const content = response.getContentText();
    return JSON.parse(content);
  } catch (error) {
    console.log((error as Object).toString());
    return null;
  }
}

function createRequest(userId:string, ogData: OgData, accessJwt: string, entryUrl: string): GoogleAppsScript.URL_Fetch.URLFetchRequest {
  const url = 'https://bsky.social/xrpc/com.atproto.repo.createRecord';
  const payload = {
    "repo": userId,
    "collection": "app.bsky.feed.post",
    "record": {
      "text": entryUrl,
      "createdAt": new Date().toISOString(),
      "facets": createFacets(entryUrl),
      "embed": createEmbed(entryUrl, accessJwt, ogData)
    }
  };
  return {
    url,
    method: "post",
    payload: JSON.stringify(payload),
    contentType: "application/json",
    headers: { "Authorization": `Bearer ${accessJwt}`},
    muteHttpExceptions: true
  }
}

function createFacets(url: string) {
  return [
    {
      index: {
        byteStart: 0,
        byteEnd: url.length
      },
      features: [{
        $type: 'app.bsky.richtext.facet#link',
        uri: url
      }]
    }
  ]
}

function createEmbed(url: string, accessJwt: string, data: OgData) {
  const imageData = blueSkyImageData(data.ogImageData!, accessJwt)
  return {
    "$type": "app.bsky.embed.external",
    "external": {
      "uri": url,
      "title": data.ogTitle,
      "description": data.ogDescription,
      "thumb": {
        "$type": "blob",
        "ref": {
          "$link": imageData.$link
        },
        "mimeType": imageData.mimeType,
        "size": imageData.size
      }
    }
  }
}

function uploadImage(imageData: OgImageData, accessJwt: string): { blob: any } {
  const url = 'https://bsky.social/xrpc/com.atproto.repo.uploadBlob';
  const method: GoogleAppsScript.URL_Fetch.HttpMethod = 'post'
  const options = {
    method,
    headers: {
      'Authorization': 'Bearer ' + accessJwt
    },
    payload: imageData.blob
  };
  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

function blueSkyImageData(imageData: OgImageData, accessJwt: string) {
  const blueskyImage = uploadImage(imageData, accessJwt);
  return {
    $link: blueskyImage.blob.ref.$link,
    mimeType: blueskyImage.blob.mimeType,
    size: blueskyImage.blob.size
  }
}