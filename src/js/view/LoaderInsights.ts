export class LoaderInsights {
  private static el: HTMLElement | null = null
  private static timeout: NodeJS.Timeout | null = null

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

  static showError(message: string): void {
    const container = document.querySelector("#notification_container")
    if (!container) return

    const errorEl = document.createElement("div")
    errorEl.classList.add("loader_error")
    errorEl.innerText = message
    errorEl.onclick = () => {
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
}
