import "dotenv/config"
import blessed from "blessed"
import {App} from "@slack/bolt"
import fs from "fs"
//@ts-ignore
import correctEmoji from "../assets/emoji.json"
import { cacheUsers, compileRequestedChannels, doINeedToCache, getCachedChannels, getCachedUsers } from "./cachestuff"
import { existsSync, readFileSync } from "fs"
const app = new App({
    token: process.env.USER_TOKEN,
    socketMode: true,
    appToken: process.env.APP_TOKEN,
})
export async function getUsername(user_id:string){
  const cachedName = getCachedUsers().find((e:any)=>e.id == user_id)?.name
  if(cachedName) return cachedName
  // time to cache a new name!!
 try {
  const apiReq =await  app.client.users.info({user: user_id})
  if(apiReq.user) {
    fs.writeFileSync("assets/data/cache-users.json", JSON.stringify([...getCachedUsers(), apiReq.user]))
    return apiReq.user.name
  }
 } catch (e: any) {
  //  console.error(e)
  if(e.stack.includes("user_not_found")) return `(unknown)`
   return `(${e.message})`
 }
}
enum FocusedOn {
  Channels,
  Chat
}
let focused = FocusedOn.Channels
async function main() {

if(doINeedToCache()) {
    console.log("caching users")
  await  cacheUsers(app)
}
// if(!existsSync("assets/data/cache-channels.json")){
   console.log(`Compiling channels`)
  await  compileRequestedChannels(JSON.parse(readFileSync("assets/data/channels-to-cache.json").toString()), app)
// }  
function cleanEmojis(t:string){
    let emojis = t.match(/:\w+:/g)
if(emojis){
    // console.log(emojis)
    for(const emoji of emojis){
        //@ts-ignore
        t = t.replaceAll(emoji, correctEmoji[emoji.split(":").join("")] || emoji)
    }
}
return t;
}
//@ts-ignore
app.event("message", (par) => {
//@ts-ignore
let t = par.event.text
if(!t) return;
t= cleanEmojis(t)
    // console.log(par.body, t)
})
app.start(3001)
}

async function screenMain() {
    const screen = blessed.screen({
        smartCSR: true,
        autoPadding: true,
        title: "Slack TUI",
        fullUnicode: true,
        log: "log.txt",
      })
      const fake_messages = [{
          author_name: `Neon`,
          text: `Oh boy i love this so much!!`,
          ts: Date.now(),
          channel: `hriuefhreiun`
      }]
    //   [{
    //     name: `mychannelnamehere`,
    //     id: `hriuefhreiun`,
    //   }, {
    //     name: `2mychannelnamehere22`,
    //     id: `hriuefhre2iun`,
    //   }]|| 
    let selected_channel: string | null = null
      //@ts-ignore
      const fake_channels = (getCachedChannels() as any[][]).flat().filter(Boolean)
      console.log(`Cached users`)
      const cached_users = getCachedUsers()
      console.debug(0)
      screen.title = `Slack TUI`
      screen.key(['escape', 'q', 'C-c'], function(ch, key) {
          return process.exit(0);
        });
      // Create a box perfectly centered horizontally and vertically.
      var chats = blessed.list({
          // top: 'center',
          left: "15%",
          // right: "3%",
          // right: 'right',
          // right: 'center3432',
          width: '86%',
          height: '90%',
          // content: 'chats here :P',
          tags: true,
          border: {
            type: 'line'
          },
          style: {
            fg: 'white',
          //   bg: 'magenta',
            border: {
              fg: '#f0f0f0'
            },
          //   hover: {
          //     bg: 'green'
          //   }
          }
        });
        // console.log(fake_channels[0])
         const channelBox = blessed.list({
          top: 'center',
          width: '15%',
          height: '100%',
          content: 'channel here :P',
          tags: true,
          border: {
            type: 'line'
          },
          style: {
            fg: 'white',
          //   bg: 'magenta',
            border: {
              fg: '#f0f0f0'
            },
            selected: {
                fg: 'white',
                bg: 'grey'
              },
              item: {
                fg: 'white',
                // bg: 'blue'
              }
          //   hover: {
          //     bg: 'green'
          //   }
          },
          items: fake_channels.map((e:any)=>{
            if(e.name) {
                return `#${e.name}`
            } else {
                return `@${cached_users.find((d:any)=>d.id == e.user)?.name}`
            }

          })
        });
        // chat input to send messages
        const chatInput =blessed.textbox({
          width: "86%",
          height: "14%",
          bottom: 0,
          right: 0,
          mouse: true,
          keys: true,
          // vi: true,
          content: "type here",
          // style: {
          //   fg: 'green',
          //   bg: 'green',
          // //   bg: 'black',
          //   border: {
          //     fg: 'green'
          //   },
          // }
          border: 'line',
          style: {
              fg: 'white',
            //   bg: 'magenta',
              border: {
                fg: '#f0f0f0'
      
              },
          
            //   hover: {
            //     bg: 'green'
            //   }
            }
        })
        async function renderMessages(channel_id: string){
            // console.debug(`#${channel_id}`)
            // clear the chats
            chats.setContent("")
            chats.clearItems()
          for(const message of ((await app.client.conversations.history({ channel: channel_id, limit: 100 }).then(e=>e.messages!)).reverse())){
            // console.debug(0)
              // const messageBox = blessed.box({
              //   parent: chats,
              //   height: "10%",
              //   content:`${message.username}: ${message.text || "No text found"}`,
              //   tags: true,
              //   border: {
              //     type: 'line'
              //   },
              // })
              if(message.thread_ts) continue;
              // if(message.subtype) continue;
              if(message.subtype== "channel_join") {
                chats.add(`${await getUsername(message.user!)} joined`)
              } else if (message.subtype== "channel_leave") {
                chats.add(`${await getUsername(message.user!)} left`)
              } else if(message.subtype == "channel_topic") {
                chats.add(`${await getUsername(message.user!)} changed the topic to ${message.topic}`)
              } else if(message.subtype == "channel_purpose") {
                chats.add(`${await getUsername(message.user!)} changed the purpose to ${message.purpose}`)
              } else if (message.subtype == "bot_message") {
                chats.add(`${await getUsername(message.user!)} (bot): ${message.text || "No text found"}`)
              } else if (message.subtype == "tabbed_canvas_updated") {
                chats.add(`Idk the canvas got updated ig`) // FIXME: WTF IS THIS
              } else if (message.subtype == "channel_archive") {
                chats.add(`${await getUsername(message.user!)} archived the channel`)
              } else if(message.subtype == "reminder_add") {
                chats.add(`${await getUsername(message.user!)} added a reminder: ${message.text}`)
              } else if (message.subtype == "joiner_notification_for_inviter") {
                chats.add(`You invited ${await getUsername(message.user!)} to the workspace msg thing`)
              } else if (message.subtype == "channel_convert_to_private") {
                chats.add(`${await getUsername(message.user!)} made the channel private`)
              }
              // slackbot_response
              else {
                chats.add(`${await getUsername(message.user!)}: ${message.text || "No text found"}`)
              }
              // if(message )
          }
          screen.render();
        }
        chatInput.key(['enter'], function(ch, key) {
          // chats.pushLine(chatInput.getValue().trim());
          //TODO: you know like um send a real message
          const message = chatInput.getValue().trim()
          if(message.length <= 0) return;
          // console.log(message)
          if(selected_channel) {
           app.client.chat.postMessage({
               channel: selected_channel!,
               text: `${message || "broken message"}`,
              ...(process.env.SEND_FOOTER ? {
                blocks: [{
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: message || "broken message"
                  }
                },{
                  type: "context",
                  elements: [{
                    type: "mrkdwn",
                    text: `*Sent via slack tui*`
                  }]
                }]
              } : {
                 text: message || "broken message"
              })
           })
          //  console.log(1)
          }
          chatInput.clearValue();
          screen.render();
        });
        channelBox.on('select', function(ch, key) {
            // chats.pushLine(channel.name);
                     //@ts-ignore
                     selected_channel = fake_channels[channelBox.selected].id
            //@ts-ignore
            renderMessages(fake_channels[channelBox.selected].id)
        console.log(selected_channel)
          })
          chatInput.on('click', () => {
            chatInput.focus()
          })
        screen.key(['up', 'down'], function (ch, key) {
            // console.debug(key.name, `#event`)
       // switch case w/ whatever is focused, by default its the channels
        if(focused == FocusedOn.Channels) {
            //@ts-ignore
          let index = channelBox.selected;  // Get the current selection index
          
          if (key.name === 'up') {
            // Move the selection up
            if (index > 0) {
              channelBox.select(index - 1);
            }
          } else if (key.name === 'down') {
            // Move the selection down
            //@ts-ignore
            if (index < channelBox.items.length - 1) {
              channelBox.select(index + 1);
            }
          }
         //@ts-ignore
         renderMessages(fake_channels[channelBox.selected].id)
                  //@ts-ignore
                  selected_channel = fake_channels[channelBox.selected].id
          // Update the selected channel when navigating
          // updateSelectedChannel(listbox.getItem(index).getContent());
        }
            screen.render();
          });
          screen.key(['tab'], function (ch, key) {
            focused = focused == FocusedOn.Channels ? FocusedOn.Chat : FocusedOn.Channels
              // channelBox.fg
              channelBox.style.fg = focused == FocusedOn.Channels ? "magenta" : "magenta"
              channelBox.bg = 3
              if(focused == FocusedOn.Channels) channelBox.focus()
              // console.log(channelBox.style)
              // channelBox.render()
            screen.render();
          })
        // Append our box to the screen.
        screen.append(chats);
        screen.append(channelBox);
        screen.append(chatInput);
        // for(const channel of fake_channels){
        //   // channelBox(channel.name);
        //   console.log(channel)
        //   const channelBox0 = blessed.button({
        //       parent: channelBox,
        //       mouse: true,
        //       keys: true,
        //       // vi: true,
        //       content: "#"+channel.name,
        //       height: "10%",
        //       padding: {
        //         bottom: 1
        //       },
        //       // style: {
        //       //   fg: 'green',
        //       //   bg: 'green',
        //       // //   bg: 'black',
        //       //   border: {
        //       //     fg: 'green'
        //       //   },
        //       // }
        //       border: 'line',
        //       style: {
        //           fg: 'white',
        //         //   bg: 'magenta',
        //           border: {
        //             fg: '#f0f0f0'
        //           },
        //             hover: {
        //               bg: 'green'
        //             }
        //         }
        //     })
        //     channelBox0.on('press', function(data:any) {
        //       // chats.pushLine(channel.name);
        //   //   console.log(channel.name);
        //     channelBox0.setContent("#"+`fucku`);
        //     renderMessages(channel.id)
        //       screen.render();
        //     });
        // }
  screen.render();
    }
main()
screenMain()
process.on('uncaughtException', function (err) {
  console.error(err)  
})