import { OnceSettings } from "../OnceSettings"
import { BackComms } from "../data/BackComms"
import * as menu from "./menu"

export class SettingsPanel {
  static instance: SettingsPanel
  constructor() {
    SettingsPanel.instance = this
    BackComms.send("settings", "subscribe_to_changes")
    BackComms.on("settings", async (event, cmd: string, ...args: unknown[]) => {
      switch (cmd) {
        case "set_filter_area":
          console.debug("set_filter_area", args)
          this.set_filter_area()
          break
        case "set_redirect_area":
          console.debug("set_redirect_area", args)
          this.set_redirect_area()
          break
        case "set_sources_area":
          console.debug("set_sources_area", args)
          this.set_sources_area()
          break
        case "highlight_sources":
          this.highlight_sources(
            args[0] as Record<string, string>,
            args[1] as boolean
          )
          break
        case "restore_theme_settings":
          console.debug("restore_theme_settings", args)
          this.restore_theme_settings()
          break
        case "restore_animation_settings":
          console.debug("restore_animation_settings", args)
          this.restore_animation_settings()
          break
        default:
          console.log("unhandled settings_panel", cmd)
          event.returnValue = null
      }
    })

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        console.debug("system theme change", e)
      })

    this.restore_theme_settings()

    const theme_select =
      document.querySelector<HTMLSelectElement>("#theme_select")
    theme_select.addEventListener("change", () => {
      this.save_theme(theme_select.value)
    })

    const anim_checkbox =
      document.querySelector<HTMLInputElement>("#anim_checkbox")
    this.restore_animation_settings()
    anim_checkbox.addEventListener("change", () => {
      this.save_animation(anim_checkbox.checked)
    })

    const couch_input = document.querySelector<HTMLInputElement>("#couch_input")
    const couch_container = couch_input.parentElement as HTMLElement
    const couch_highlights =
      couch_container.querySelector<HTMLElement>(".couch-highlights")
    const couch_toggle =
      couch_container.querySelector<HTMLButtonElement>("#couch_toggle")

    const updateCouchHighlights = () => {
      const val = couch_input.value
      if (!val) {
        couch_highlights.textContent = ""
        return
      }

      try {
        const url = new URL(val)
        if (url.password && couch_container.classList.contains("masked")) {
          // Mask the password part
          const maskedPassword = "•".repeat(url.password.length)
          // Reconstruct the display string: protocol://user:••••@host...
          // We can't just set url.password because it encodes it
          // Better to use a simple string rebuild or handle the components
          // Actually, let's be more robust:
          // Find the last ':' before '@' and the '@' itself
          const authEnd = val.lastIndexOf("@")
          const passStart = val.lastIndexOf(":", authEnd)

          if (passStart !== -1 && passStart < authEnd) {
            const before = val.substring(0, passStart + 1)
            const after = val.substring(authEnd)
            couch_highlights.textContent = before + maskedPassword + after
          } else {
            couch_highlights.textContent = val
          }
        } else {
          couch_highlights.textContent = val
        }
      } catch (e) {
        // Not a full URL or invalid, just show as is
        couch_highlights.textContent = val
      }
    }

    couch_toggle.addEventListener("click", (e) => {
      e.preventDefault()
      couch_container.classList.toggle("masked")
      couch_toggle.textContent = couch_container.classList.contains("masked")
        ? "👁️"
        : "🙈"
      updateCouchHighlights()
    })

    couch_input.addEventListener("input", updateCouchHighlights)

    this.reset_couch_settings().then(() => updateCouchHighlights())

    couch_container.parentElement
      .querySelector('input[value="save"]')
      .addEventListener("click", () => {
        this.save_couch_settings()
      })
    couch_container.parentElement
      .querySelector('input[value="cancel"]')
      .addEventListener("click", () => {
        this.reset_couch_settings().then(() => updateCouchHighlights())
      })

    this.set_sources_area()

    const sources_area =
      document.querySelector<HTMLInputElement>("#sources_area")
    const sources_block = sources_area.closest(".settings_block")
    sources_block
      .querySelector('input[value="save"]')
      .addEventListener("click", () => {
        this.save_sources_settings()
      })
    sources_block
      .querySelector('input[value="cancel"]')
      .addEventListener("click", () => {
        this.set_sources_area()
      })

    sources_area.addEventListener("keydown", (e) => {
      if (e.keyCode === 27) {
        //ESC
        this.set_sources_area()
      } else if (e.key == "s" && e.ctrlKey) {
        //CTRL + s
        this.save_sources_settings()
      }
    })

    const highlights = document.querySelector<HTMLElement>(".highlights")

    const handleInput = () => {
      const text = sources_area.value
      highlights.innerHTML = ""

      const lines = text.split("\n")

      lines.forEach((line) => {
        let errorMessage: string | null = null
        for (const [url, message] of Object.entries(this.failedSources)) {
          if (!url) continue
          if (line.trim() === url.trim()) {
            errorMessage = message
            break
          }
        }

        const lineContainer = document.createElement("div")
        lineContainer.classList.add("line-mirrored")

        if (errorMessage) {
          lineContainer.classList.add("error-line")
          const icon = document.createElement("div")
          icon.classList.add("error-icon")
          icon.textContent = "❗"
          icon.title = "Click for error details"
          icon.style.pointerEvents = "auto"
          icon.style.cursor = "pointer"
          icon.onclick = () => {
            alert(`Error loading source:\n${errorMessage}`)
          }
          lineContainer.appendChild(icon)

          const mark = document.createElement("mark")
          mark.textContent = line || " "
          lineContainer.appendChild(mark)
        } else {
          lineContainer.textContent = line || " "
        }

        highlights.appendChild(lineContainer)
      })
    }

    const handleScroll = () => {
      highlights.scrollTop = sources_area.scrollTop
    }

    sources_area.addEventListener("input", handleInput)
    sources_area.addEventListener("scroll", handleScroll)
    // Initial sync
    handleInput()

    this.set_filter_area()

    const filter_area = document.querySelector<HTMLInputElement>("#filter_area")
    const filter_block = filter_area.closest(".settings_block")
    filter_block
      .querySelector('input[value="save"]')
      .addEventListener("click", () => {
        this.save_filter_settings()
      })
    filter_block
      .querySelector("input[value=cancel]")
      .addEventListener("click", () => {
        this.set_filter_area()
      })

    filter_area.addEventListener("keydown", (e) => {
      if (e.keyCode === 27) {
        //ESC
        this.set_filter_area()
      } else if (e.key == "s" && e.ctrlKey) {
        //CTRL + s
        this.save_filter_settings()
      }
    })

    this.set_redirect_area()

    const redirect_area =
      document.querySelector<HTMLInputElement>("#redirect_area")
    const redirect_block = redirect_area.closest(".settings_block")
    redirect_block
      .querySelector('input[value="save"]')
      .addEventListener("click", () => {
        this.save_redirect_settings()
      })
    redirect_block
      .querySelector("input[value=cancel]")
      .addEventListener("click", () => {
        this.set_redirect_area()
      })

    redirect_area.addEventListener("keydown", (e) => {
      if (e.keyCode === 27) {
        //ESC
        this.set_filter_area()
      } else if (e.key == "s" && e.ctrlKey) {
        //CTRL + s
        this.save_redirect_settings()
      }
    })
  }

  async reset_couch_settings(): Promise<void> {
    const couch_input = document.querySelector<HTMLInputElement>("#couch_input")
    couch_input.value = await OnceSettings.instance.get_sync_url()
  }

  save_couch_settings(): void {
    const couch_input = document.querySelector<HTMLInputElement>("#couch_input")
    OnceSettings.instance.set_sync_url(couch_input.value)
  }

  async restore_theme_settings(): Promise<void> {
    const theme_value = await OnceSettings.instance.pouch_get("theme", "dark")

    const theme_select =
      document.querySelector<HTMLSelectElement>("#theme_select")
    theme_select.value = theme_value
    this.set_theme(theme_value)
  }

  save_theme(name: string): void {
    BackComms.send("settings", "pouch_set", "theme", name)
    this.set_theme(name)
  }

  async restore_animation_settings(): Promise<void> {
    const checked = await OnceSettings.instance.pouch_get("animation", true)

    const anim_checkbox =
      document.querySelector<HTMLInputElement>("#anim_checkbox")
    anim_checkbox.checked = checked
    this.set_animation(checked)
  }

  save_animation(checked: boolean): void {
    BackComms.send("settings", "pouch_set", "animation", checked)
    const anim_checkbox =
      document.querySelector<HTMLInputElement>("#anim_checkbox")
    anim_checkbox.checked = checked
    this.set_animation(checked)
  }

  set_animation(checked: boolean): void {
    document.body.setAttribute("animated", checked.toString())
  }

  set_theme(name: string): void {
    switch (name) {
      case "dark":
        BackComms.send("settings", "set_theme", "dark")
        break
      case "light":
        BackComms.send("settings", "set_theme", "light")
        break
      case "custom":
        console.debug("custom theme, not implement, just hanging out here :D")
        break
      case "system":
        BackComms.send("settings", "set_theme", "system")
        break
    }
  }

  async set_sources_area(): Promise<void> {
    const sources_area =
      document.querySelector<HTMLTextAreaElement>("#sources_area")
    const story_sources = await OnceSettings.instance.story_sources()
    sources_area.value = story_sources.join("\n")
    // Trigger input event to update highlights
    sources_area.dispatchEvent(new Event("input"))
  }

  async save_sources_settings(): Promise<void> {
    const sources_area =
      document.querySelector<HTMLTextAreaElement>("#sources_area")
    const story_sources = sources_area.value.split("\n").filter((x) => {
      return x.trim() != ""
    })

    BackComms.send("settings", "pouch_set", "story_sources", story_sources)
  }

  async set_filter_area(): Promise<void> {
    const filter_area = document.querySelector<HTMLInputElement>("#filter_area")
    const filter_list = await OnceSettings.instance.get_filterlist()
    filter_area.value = filter_list.join("\n")
  }

  save_filter_settings(): void {
    const filter_area = document.querySelector<HTMLInputElement>("#filter_area")
    const filter_list = filter_area.value.split("\n").filter((x) => {
      return x.trim() != ""
    })
    BackComms.send("settings", "save_filterlist", filter_list)
  }

  async set_redirect_area(): Promise<void> {
    const redirect_area =
      document.querySelector<HTMLInputElement>("#redirect_area")
    const redirect_list = await OnceSettings.instance.get_redirectlist()
    redirect_area.value = OnceSettings.present_redirectlist(redirect_list)
  }

  save_redirect_settings(): void {
    const redirect_area =
      document.querySelector<HTMLInputElement>("#redirect_area")
    const redirect_list = OnceSettings.parse_redirectlist(redirect_area.value)
    BackComms.send("settings", "save_redirectlist", redirect_list)
  }

  failedSources: Record<string, string> = {}

  public highlight_sources(
    failedSources: Record<string, string>,
    shouldOpenPanel = true
  ): void {
    console.log("SettingsPanel: highlighting sources", failedSources)
    this.failedSources = failedSources

    if (shouldOpenPanel) {
      // Switch panel to settings directly
      menu.open_panel("settings")
    }

    const sources_area =
      document.querySelector<HTMLTextAreaElement>("#sources_area")
    if (!sources_area) {
      console.error("SettingsPanel: sources_area not found!")
      return
    }

    // Trigger update
    sources_area.dispatchEvent(new Event("input"))

    if (shouldOpenPanel) {
      // Scroll to first error
      const urls = Object.keys(failedSources)
      if (urls.length > 0) {
        const text = sources_area.value
        const url = urls[0]
        const idx = text.indexOf(url)
        if (idx !== -1) {
          console.log("SettingsPanel: scrolling to", url)
          sources_area.focus()
          sources_area.setSelectionRange(idx, idx + url.length)
          // blur/focus hack to attempt scroll to selection
          sources_area.blur()
          sources_area.focus()
        } else {
          console.warn("SettingsPanel: could not find url in sources", url)
        }
      }
    }
  }
}
