const keys = [
  'useMastodon', 'mastodonDomain', 'mastodonAccessToken',
  'useBluesky', 'blueskyId', 'blueskyAppPassword',
];
const privateKeys = ['mastodonAccessToken', 'blueskyAppPassword']

export function getProperties() {
  const sp = PropertiesService.getScriptProperties()
  return Object.fromEntries(keys.map((key) => {
    const value = sp.getProperty(key)
    if(privateKeys.some((pk) => pk === key) && !!value) {
      return [key, "*****"]
    }
    return [key, value]
  }))
}

export function setProperties(data: {[key: string]: string}) {
  const sp = PropertiesService.getScriptProperties()
  for(const key of privateKeys) {
    if(!data[key]) delete data[key]
  }
  sp.setProperties(data, false)
}