## How to generate channel set.
1. go to https://app.slack.com/client (homepage pretty much)
2. expand all channels sections to capture all channels
3. run 
```js
JSON.stringify(Array.from(document.querySelectorAll(`[data-qa-channel-sidebar-channel-id]`)).map(e=>e.getAttribute(`data-qa-channel-sidebar-channel-id`)))
```
this while collect all the channel ID's  of the channels found on the sidebar including dm's
4. append this to `assets/data/channels-to-cache.json`
5. once you start, it will cache these channels and on new channel create it will be added to the cache
- - it will also compile mentioned channels