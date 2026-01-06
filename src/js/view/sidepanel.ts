import { OnceSettings } from "../OnceSettings"
import { SettingsPanel } from "./SettingsPanel"
import { StoryHistory } from "./StoryHistory"
import { TabWrangler } from "./TabWrangler"
import { URLRedirect } from "../data/URLRedirect"
import * as story_list from "./StoryList"
import * as search from "../data/search"
import * as side_menu from "./menu"
import * as story_loader from "../data/StoryLoader"
import * as story_parser from "../data/parser"
import { StoryListItem } from "./StoryListItem"
import { StoryMap } from "../data/StoryMap"
import { LoaderInsights } from "./LoaderInsights"

//URLRedirect.init()

document.addEventListener("DOMContentLoaded", async () => {
  new OnceSettings()
  new StoryMap()
  new SettingsPanel()
  new StoryHistory()
  story_list.init()
  side_menu.init()
  LoaderInsights.init()
  search.init_search()
  story_parser.add_all_css_colors()
  const tab_content = document.querySelector<HTMLElement>("#tab_content")
  const tab_dropzone = document.querySelector<HTMLElement>("#tab_dropzone")
  if (tab_content && tab_dropzone) {
    const tab_wrangler = new TabWrangler(tab_dropzone, tab_content, {
      addtab_button: true,
    })
  }

  const dev_cache = false

  const grouped_story_sources =
    await OnceSettings.instance.grouped_story_sources()
  console.log("grouped_story_sources", grouped_story_sources)
  if (grouped_story_sources) {
    story_loader.parallel_load_stories(grouped_story_sources, dev_cache)
  } else {
    console.error("no sources", grouped_story_sources)
  }

  browser.tabs.onActivated.addListener(async (activeInfo) => {
    const win = await browser.windows.getCurrent()
    const tab = await browser.tabs.get(activeInfo.tabId)
    console.log("Tab switched, new URL:", tab, win.id, tab.windowId)
    if (tab.windowId == win.id) {
      update_selected(tab.url)
    }
  })

  browser.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
    console.log(tabId, changeInfo, tab)
    const cw = await browser.windows.getCurrent()

    if (tab.active && tab.windowId == cw.id) {
      update_selected(tab.url)
    }
  })

  document.querySelectorAll<HTMLElement>(".collapsebutton").forEach((x) => {
    x.onclick = collapse_menu
  })
})

function collapse_menu() {
  const menu = document.querySelector("#menu")
  if (menu.classList.contains("collapse")) {
    menu.classList.remove("collapse")
    document.querySelectorAll<HTMLElement>(".collapsebutton").forEach((x) => {
      x.innerText = "<"
    })
  } else {
    menu.classList.add("collapse")
    document.querySelectorAll<HTMLElement>(".collapsebutton").forEach((x) => {
      x.innerText = ">"
    })
  }
}

async function update_selected(href: string) {
  // ReaderMode: Extract and decode the original URL from the query string
  if (href.startsWith("about:reader?url=")) {
    const urlParams = new URLSearchParams(href.replace("about:reader", ""))
    href = decodeURIComponent(urlParams.get("url"))
  }

  const selected_container = document.querySelector("#selected_container")
  const selected_story_el =
    selected_container.querySelector<StoryListItem>("story-item")

  if (selected_story_el && selected_story_el.story.href == href) {
    return
  }

  const story = await StoryMap.remote.find_by_url(href)

  if (!story) {
    selected_container.innerHTML = ""
    return
  }

  const story_el = new StoryListItem(story)
  story_el.classList.add("selected")
  selected_container.innerHTML = ""
  selected_container.append(story_el)
}
