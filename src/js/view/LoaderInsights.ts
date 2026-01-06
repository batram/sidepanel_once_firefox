import { OnceSettings } from "../OnceSettings"

export class LoaderInsights {
  private static el: HTMLElement | null = null
  private static timeout: NodeJS.Timeout | null = null
  private static failedSources: Map<string, string> = new Map()

  static init(): void {
    if (this.el) return

    const container = document.querySelector("#stories_panel")
    if (container) {
      // Check if container already exists (retry mechanics)
      let notifContainer = document.querySelector("#notification_container")
      if (!notifContainer) {
        notifContainer = document.createElement("div")
        notifContainer.id = "notification_container"
        container.appendChild(notifContainer)
      }

      this.el = document.createElement("div")
      this.el.id = "loader_insights"
      notifContainer.appendChild(this.el)
    }
  }

  static show(message: string): void {
    if (!this.el) return

    this.el.innerText = message
    this.el.classList.add("visible")

    if (this.timeout) {
      clearTimeout(this.timeout)
    }
  }

  static showError(
    message: string,
    url?: string,
    detailedMessage?: string
  ): void {
    const container = document.querySelector("#notification_container")
    if (!container) return

    // Deduplicate: if this URL already has an error displayed, skip
    if (url && this.failedSources.has(url)) {
      return
    }

    if (url) {
      this.failedSources.set(url, detailedMessage || message)
    }

    const errorEl = document.createElement("div")
    errorEl.classList.add("loader_error")

    // Text span for the message
    const textSpan = document.createElement("span")
    textSpan.innerText = message
    errorEl.appendChild(textSpan)

    // Close button (X)
    const closeBtn = document.createElement("span")
    closeBtn.classList.add("error_close")
    closeBtn.innerText = "×"
    closeBtn.onclick = (e) => {
      e.stopPropagation() // Don't navigate to settings
      errorEl.classList.remove("visible")
      setTimeout(() => errorEl.remove(), 300)
    }
    errorEl.appendChild(closeBtn)

    // Clicking the main area navigates to settings
    errorEl.onclick = () => {
      const failedMap = Object.fromEntries(this.failedSources)
      OnceSettings.instance.highlightSources(failedMap)

      errorEl.classList.remove("visible")
      setTimeout(() => errorEl.remove(), 300)
    }
    container.appendChild(errorEl)

    // Trigger reflow to enable transition
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = errorEl.offsetHeight

    requestAnimationFrame(() => {
      errorEl.classList.add("visible")
    })
  }

  static hide(): void {
    if (!this.el) return

    // Allow a small delay before hiding so the last message is readable
    this.timeout = setTimeout(() => {
      this.el?.classList.remove("visible")
    }, 1000)
  }

  static resetErrors(): void {
    this.failedSources.clear()
    // Optionally remove existing error elements if we want a fresh start ui-wise too
    const container = document.querySelector("#notification_container")
    if (container) {
      container.querySelectorAll(".loader_error").forEach((el) => el.remove())
    }
  }
}
