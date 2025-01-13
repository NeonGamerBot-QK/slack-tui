import fs from "fs"
import {App} from "@slack/bolt"
export function doINeedToCache() {
return !fs.existsSync("assets/data/cache-users.json")
//  || !fs.existsSync("assets/cache-channels.json")
}
//#apimayratelimit
export async function cacheUsers(app:App) {
    //@ts-ignore
    if(app.bclient) app = app.bclient
    let allUsers:any[] = [];
    let cursor;
    try {
      do {
        const result = await app.client.users.list({
          cursor: cursor
        });
        if (result.ok) {
          // Extract user IDs from the current page
          const users = result.members;
          allUsers = [...allUsers, ...users!];
          // Set the cursor for the next request, if any
          cursor = result.response_metadata?.next_cursor;
        } else {
          console.error('Error fetching users:', result.error);
          break;
        }
      } while (cursor);
      
    //   console.log('All member IDs:', allUserIds);
      fs.writeFileSync("assets/data/cache-users.json", JSON.stringify(allUsers));
      return allUsers;
    } catch (error) {
      console.error('Error fetching members:', error);
    }
}
export function getCachedUsers() {
  //@ts-ignore
    let r = global.users ? global.users : global.users = JSON.parse(fs.readFileSync("assets/data/cache-users.json").toString())
  return r;
  }

// export async function cacheChannels() {
//     //@ts-ignore
//     if(app.bclient) app = app.bclient
//     let allChannels:any[] = [];
//     let cursor;
//     try {
//       do {
//         const result = await app.client.conversations.list({
//           cursor: cursor
//         });
//         if (result.ok) {
//           // Extract user IDs from the current page
//           const channels = result.channels;
//           allChannels = [...allChannels, ...channels!];
//           // Set the cursor for the next request, if any
//           cursor = result.response_metadata?.next_cursor;
//         } else {
//           console.error('Error fetching channels:', result.error);
//           break;
//         }
//       } while (cursor);
//     //   console.log('All member IDs:', allUserIds);
//       fs.writeFileSync("assets/cache-channels.json", JSON.stringify(allChannels));
//       return allChannels;
//     } catch (error) {
//       console.error('Error fetching channels:', error);
//     }
// }
export async function compileRequestedChannels(channels:string[], app: App) {
   const currentChannelCache = fs.existsSync("assets/data/cache-channels.json") ? JSON.parse(fs.readFileSync("assets/data/cache-channels.json").toString()) : []
   const newStuff = []
   for(const channel of channels){
        if(currentChannelCache.find((e:any)=>e.id == channel)){
        await new Promise(r=>setTimeout(r, 50))
            continue;
        }
        await new Promise(r=>setTimeout(r, 10))
        const channelInfo = await app.client.conversations.info({channel: channel})
        newStuff.push(channelInfo.channel!)
        await new Promise(r=>setTimeout(r, 1000))
    }
    fs.writeFileSync("assets/data/cache-channels.json", JSON.stringify([...newStuff, currentChannelCache]));
}

export function getCachedChannels() {
    return JSON.parse(fs.readFileSync("assets/data/cache-channels.json").toString())
}
export function getUserName(user_id:string){
    const cachedName = getCachedUsers().find((e:any)=>e.id == user_id)?.name
    if(cachedName) return cachedName
    // time to cache a new name!!
}