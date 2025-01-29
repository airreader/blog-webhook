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
export function createMastodonRequest(message: string): GoogleAppsScript.URL_Fetch.URLFetchRequest | undefined {
  const sp = PropertiesService.getScriptProperties();
  const useMastodon = sp.getProperty("useMastodon");
  const domain = sp.getProperty("mastodonDomain");
  const token = sp.getProperty("mastodonAccessToken");
  if(useMastodon !== "true" || !domain || !token) return;
  return {
    url: `https://${domain}/api/v1/statuses`,
    method: "post",
    payload: `status=${message}`,
    headers: { "Authorization": `Bearer ${token}`},
    muteHttpExceptions: true
  }
}