import puppeteer from "puppeteer-extra";
import {SearchKeyword} from "./question-list";


// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import {save} from "@/src/utils/save";

declare global {
    var browser: import('puppeteer').Browser, questionList: SearchKeyword[];
}

//Main
const main = async () => {
    //Load env
    await import("dotenv/config")
    //Load saved data
    await import("./question-list")

    //Register plugins before launching browser
    puppeteer.use(StealthPlugin())
    //puppeteer.use(AdblockerPlugin({blockTrackers: true}))

    //Launch browser with optional proxy support
    const launchOptions: any = {
        headless: false,
        userDataDir: "./user-data",
        executablePath: process.env.BROWSER_PATH,//ok to be undefined
    };

    // Add proxy configuration if PROXY_SERVER is set
    if (process.env.PROXY_SERVER) {
        console.log(`Using proxy: ${process.env.PROXY_SERVER}`);
        launchOptions.args = [
            `--proxy-server=${process.env.PROXY_SERVER}`
        ];
    }

    globalThis.browser = await puppeteer.launch(launchOptions);

    // Server
    await import('./utils/Database/server')
    //const resultPage = await browser.newPage();
    //resultPage.goto("http://localhost:8080",{timeout:0})

    //auto save
    setInterval(function () {
        save()
    }, 15000)

    //Question Loop
    const {QuestionLoop} = await import("./QuestionLoop")
    await QuestionLoop();
}

const retry = async (e = "Start" as any, retryCount = 0) => {
    const MAX_RETRIES = 3;

    console.log("Retried because of the err below:");
    console.error(e);

    // Check if error is about browser already running
    if (e?.message?.includes("browser is already running")) {
        console.error("\n❌ ERROR: Browser is already running!");
        console.error("Please close any existing Chrome instances or run: pkill -f 'Google Chrome for Testing.*user-data'");
        process.exit(1);
    }

    if (retryCount >= MAX_RETRIES) {
        console.error(`\n❌ Max retries (${MAX_RETRIES}) reached. Exiting...`);
        process.exit(1);
    }

    console.log(`Retry attempt ${retryCount + 1}/${MAX_RETRIES}...`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
    await main().catch(e => retry(e, retryCount + 1));
};
await retry();
