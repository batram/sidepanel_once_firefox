import { OnceSettings } from "../OnceSettings"
import { BackComms } from "./BackComms"

export class Redirect {
  match_url: string
  replace_url: string
}

export class URLRedirect {
  static dynamic_url_redirects: Redirect[]

  static init(): void {
    const sets = OnceSettings.instance
    sets.get_redirectlist().then((x) => {
      URLRedirect.dynamic_url_redirects = x
      BackComms.send("story_list", "update_redirects")
    })
  }

  static redirect_url(url: string): string {
    if (URLRedirect.dynamic_url_redirects)
      URLRedirect.dynamic_url_redirects.forEach((redirect) => {
        const rex = new RegExp(redirect.match_url)
        if (url.match(rex)) {
          url = url.replace(
            new RegExp(redirect.match_url),
            redirect.replace_url
          )
        }
      })
    return url
  }
}
