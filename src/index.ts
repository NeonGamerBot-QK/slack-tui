import "dotenv/config"
import blessed from "blessed"
import {App} from "@slack/bolt"
//@ts-ignore
import correctEmoji from "../assets/emoji.json"
import { cacheUsers, compileRequestedChannels, doINeedToCache, getCachedChannels, getCachedUsers } from "./cachestuff"
import { existsSync, readFileSync } from "fs"
const app = new App({
    token: process.env.USER_TOKEN,
    socketMode: true,
    appToken: process.env.APP_TOKEN,
})
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
      var chats = blessed.box({
          // top: 'center',
          left: "15%",
          // right: "3%",
          // right: 'right',
          // right: 'center',
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
            console.debug(`#${channel_id}`)
            // clear the chats
            chats.setContent("")
          for(const message of await app.client.conversations.history({ channel: channel_id }).then(e=>e.messages!)){
              const messageBox = blessed.box({
                parent: chats,
                height: "10%",
                content:`${message.username}: ${message.text || "No text found"}`,
                tags: true,
                border: {
                  type: 'line'
                },
              })
          }
          screen.render();
        }
        chatInput.key(['enter'], function(ch, key) {
          // chats.pushLine(chatInput.getValue().trim());
          //TODO: you know like um send a real message
          chatInput.clearValue();
          screen.render();
        });
        channelBox.on('select', function(ch, key) {
            // chats.pushLine(channel.name);
            //@ts-ignore
            renderMessages(fake_channels[channelBox.selected].id)
        })
        screen.key(['up', 'down'], function (ch, key) {
            // console.debug(key.name, `#event`)
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
            // Update the selected channel when navigating
            // updateSelectedChannel(listbox.getItem(index).getContent());
            screen.render();
          });
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