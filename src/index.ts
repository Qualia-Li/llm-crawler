import puppeteer from "puppeteer-extra";
import {SearchKeyword} from "./question-list";


// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
import StealthPlugin from "puppeteer-extra-plugin-stealth";


// Add adblocker plugin to block all ads and trackers (saves bandwidth)
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";

declare global {
    var browser: import('puppeteer').Browser;
    var questionList: SearchKeyword[];
}

//Main
{
    //Load env
    await import("dotenv/config")
    //Load saved data
    await import("./question-list")

    //Launch browser
    globalThis.browser = await puppeteer.launch({
        headless: false,
        userDataDir: "./user-data",
    });
    puppeteer.use(StealthPlugin())
    puppeteer.use(AdblockerPlugin({blockTrackers: true}))

    // Server
    await import('./utils/Database/server')
    //const resultPage = await browser.newPage();
    //resultPage.goto("http://localhost:8080",{timeout:0})

    //Question Loop
    const {QuestionLoop} = await import("./QuestionLoop")
    await QuestionLoop();
}
