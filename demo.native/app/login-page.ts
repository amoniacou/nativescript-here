import { EventData } from "tns-core-modules/data/observable";
import { Button } from "tns-core-modules/ui/button";
import { Page } from "tns-core-modules/ui/page";

export function onTap(args: EventData) {
  const button: Button = <Button>args.object;
  const page: Page = button.page;

  // using clearHistory will prevent the page from entering the navigation stack
  // effectivly preventing the users returning back to this page (e.g. by using the hardware back button on Android)
  page.frame.navigate({
    moduleName: "main-page",
    clearHistory: true
  });
}