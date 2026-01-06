import * as story_parser from "../data/parser"
import { StoryMap } from "../data/StoryMap"
import * as menu from "../view/menu"
import { Story } from "./Story"
import * as story_filters from "./StoryFilters"
import { LoaderInsights } from "../view/LoaderInsights"

function get_cached(url: string) {
  let cached = localStorage.getItem(url)
  const max_mins = 5000

  try {
    cached = JSON.parse(cached)
    if (!Array.isArray(cached)) {
      throw "cached entry is not Array"
    }
    if (cached.length != 2) {
      throw "cached entry not length 2"
    }
    const mins_old = (Date.now() - cached[0]) / (60 * 1000)
    if (mins_old > max_mins) {
      throw "cached entry out of date " + mins_old
    } else {
      console.log("cached", mins_old, url)
    }
  } catch (e) {
    console.log("cache error: ", e)
    return null
  }

  return cached[1]
}

export async function parallel_load_stories(
  story_groups: Record<string, string[]>,
  try_cache = true
): Promise<void> {
  const promises: Promise<void>[] = []
  for (const group_name in story_groups) {
    menu.add_group(group_name)
    const group = story_groups[group_name]
    group.map((source_entry) => {
      promises.push(
        cache_load(source_entry, try_cache).then((stories) => {
          let domain = "source"
          try {
            domain = new URL(source_entry).hostname.replace("www.", "")
          } catch {
            domain = source_entry.substring(0, 20)
          }

          LoaderInsights.show("Processed " + domain)
          process_story_input(stories, group_name)
        })
      )
    })
  }

  await Promise.all(promises)
  LoaderInsights.hide()
}

async function process_story_input(stories: Story[], group_name: string) {
  if (!stories) {
    return
  }
  const filtered_stories = await story_filters.filter_stories(stories)
  const all_stories = filtered_stories.sort()
  all_stories.forEach((story) => {
    story.tags.push({
      class: "group",
      text: "*" + group_name,
      href: "search:" + "*" + group_name,
    })
  })
  StoryMap.remote.stories_loaded(all_stories, "stories")
}

//data loader
async function cache_load(url: string, try_cache = true) {
  let cached = null
  if (try_cache) {
    //TODO: do we need to store the type?
    cached = get_cached(url)
  }

  const parser = story_parser.get_parser_for_url(url)
  if (!parser) {
    console.info("no parser for", url)
    return
  }

  let domain = "source"
  try {
    domain = new URL(url).hostname.replace("www.", "")
  } catch {
    domain = url.substring(0, 20)
  }
  LoaderInsights.show("Fetching " + domain)

  const og_url = url

  if (parser && parser.resolve_url) {
    url = parser.resolve_url(url)
  }

  if (cached != null) {
    if (parser.options.collects == "dom") {
      cached = story_parser.parse_dom(cached, url)
    } else if (parser.options.collects == "xml") {
      cached = story_parser.parse_xml(cached)
    }
    return parser.parse(cached) || []
  } else {
    const resp = await fetch(url)
    if (resp.ok) {
      return story_parser.parse_response(resp, url, og_url) || []
    }
  }
}

export async function load(
  story_groups: Record<string, string[]>
): Promise<void> {
  const cache = false
  parallel_load_stories(story_groups, cache)
}
