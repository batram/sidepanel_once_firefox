import * as presenters_backend from "./js/view/presenters_backend"
import { StoryMap } from "./js/data/StoryMap"
import { OnceSettings } from "./js/OnceSettings"

function iniBackground() {
  new OnceSettings()
  new StoryMap()

  presenters_backend.custom_protocol()

  console.log("moin background=? ", browser, browser.action)

  if (browser && browser.action && browser.sidebarAction)
    browser.action.onClicked.addListener(() => {
      console.log("clicky")
      browser.sidebarAction.toggle()
    })
}

iniBackground()

browser.contextMenus.removeAll()
browser.contextMenus.create({
  id: "once_undo",
  title: "undo",
  contexts: ["all"],
  viewTypes: ["sidebar"],
  documentUrlPatterns: [browser.runtime.getURL("/static/sidepanel.html")],
})

// Keep heartbeat
let heartTimer: number | NodeJS.Timeout
const keepAlive = () => {
  heartTimer && clearTimeout(heartTimer)
  heartTimer = setTimeout(() => {
    /* browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      console.info("[heartbeat]")
      //tabs.length &&
      //  chrome.tabs.sendMessage(tabs[0].id, { action: "heartbeat" })
    }) */
    keepAlive()
  }, 10000)
}
keepAlive()
