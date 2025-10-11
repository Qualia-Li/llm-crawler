import puppeteer, { Puppeteer } from "puppeteer";

import {
    createRunner,
    PuppeteerRunnerExtension,
    UserFlow,
} from "@puppeteer/replay";
import { recording } from "./replay";

const userDataDir = "./user-data";

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: `C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`,
        userDataDir: userDataDir,
    });

    const page = await browser.newPage();

    // Create a runner and execute the script.
    const runner = await createRunner(
        recording[0] as UserFlow,
        new PuppeteerRunnerExtension(browser, page)
    );
    await runner.run();
})();
