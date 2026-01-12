import { OnceSettings } from "../OnceSettings"

export class BackComms {
  static sendSync(arg0: string, ...args: any[]): boolean {
    throw new Error("Method not implemented. sendSync")
  }

  static sendTo(id: number, channel: string, ...args: any[]) {
    throw new Error("Method not implemented. sendTo")
  }

  static handlers: any[string] = []
  static localHandlers: Record<
    string,
    ((event: any, ...args: any[]) => any)[]
  > = {}

  static handlex(
    arg0: string,
    arg1: (event: any, cmd: any, ...args: unknown[]) => Promise<unknown>
  ) {
    BackComms.handlers[arg0] = arg1
    browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      ;(async function () {
        if (msg.cmd == arg0) {
          const key = await arg1(sender, msg.args.shift(), msg.args)
          sendResponse({ complete: true, res: key })
        }
      })()

      // return true to indicate you want to send a response asynchronously
      if (msg.cmd == arg0) return true
    })
  }

  static async invoke(...args: any[]): Promise<any> {
    console.log("invoke", args)
    const handle = args.shift()
    const handler = BackComms.handlers[handle]
    if (handler) {
      return handler(null, args.shift(), args)
    } else {
      return OnceSettings.instance.handle(null, handle, args)
    }
  }

  static on(
    arg0: string,
    arg1: (event: any, ...args: any[]) => any,
    ...args: unknown[]
  ) {
    console.log("on", arg0, arg1)
    // Store handler locally for direct calling
    if (!BackComms.localHandlers[arg0]) {
      BackComms.localHandlers[arg0] = []
    }
    BackComms.localHandlers[arg0].push(arg1)

    browser.runtime.onMessage.addListener(async function (msg, sender) {
      const c = msg.cmd
      if (msg.send == "send" && arg0 == c) {
        console.log("on send recv", arg0, c, msg)
        arg1(sender, ...msg.args)
      }
    })
  }

  static send(...args: any[]): Promise<any> {
    const cmd = args.shift()
    console.log("send", cmd, args)

    // Check if we have local handlers and call them directly
    if (BackComms.localHandlers[cmd]) {
      console.log("Calling local handlers for", cmd)
      BackComms.localHandlers[cmd].forEach((handler) => {
        handler(null, ...args)
      })
    }

    // Fall back to browser messaging if no local handler
    return browser.runtime.sendMessage(browser.runtime.id, {
      send: "send",
      cmd: cmd,
      args: args,
    })
  }
}
