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
import { createMastodonRequest } from './mastodon';
import { createBlueskyRequest } from './bluesky';
import { getProperties, setProperties } from './properties';
import { getOgData } from './og';

type PublicationType = "entry" | "page";
type PublicationStatus = "public" | "draft";
interface WebhookPayload {
  event_type: string,
  client_payload: {
      blog_host: string,
      publication_id: string,
      publication_type: PublicationType,
      publication_url: string,
      publication_new_status: PublicationStatus,
      publication_old_status: PublicationStatus | "",
      user: string,
      timestamp: string
  },
  token: string
}

function doGet(event: GoogleAppsScript.Events.DoGet) {
  return HtmlService.createTemplateFromFile('top').evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function doPost(event: GoogleAppsScript.Events.DoPost) {
  const content = event.postData.contents;
  const data: WebhookPayload = JSON.parse(content);
  if(!justPublished(data.client_payload.publication_new_status, data.client_payload.publication_old_status)) return;
  if(PropertiesService.getScriptProperties().getProperty("blogToken") !== data.token) return;
  const requests = createRequests(data)

  UrlFetchApp.fetchAll(requests)
}

function justPublished(newStatus: PublicationStatus, oldStatus: PublicationStatus | "") {
  return newStatus === "public" &&  oldStatus !== "public"
}

function createMessage(data: WebhookPayload) {
  return data.client_payload.publication_url
}

function createRequests(data: WebhookPayload) {
  const entryUrl = data.client_payload.publication_url;
  const ogData = getOgData(entryUrl)
  const mastodonRequest = createMastodonRequest(entryUrl);
  const blueskyRequest = createBlueskyRequest(entryUrl, ogData);

  const requests = [];
  mastodonRequest != null && requests.push(mastodonRequest);
  blueskyRequest != null && requests.push(blueskyRequest);

  return requests
}

function getContent(filename: string) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getConfigs() {
  return getProperties()
}

function setConfigs(data: {[key: string]: string}) {
  setProperties(data)
}