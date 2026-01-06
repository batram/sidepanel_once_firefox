export class LoaderInsights {
  private static el: HTMLElement | null = null
  private static timeout: NodeJS.Timeout | null = null

  static init(): void {
    if (this.el) return

    const container = document.querySelector("#stories_panel")
    if (container) {
      this.el = document.createElement("div")
      this.el.id = "loader_insights"
      container.appendChild(this.el)
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

  static hide(): void {
    if (!this.el) return

    // Allow a small delay before hiding so the last message is readable
    this.timeout = setTimeout(() => {
      this.el?.classList.remove("visible")
    }, 1000)
  }
}
