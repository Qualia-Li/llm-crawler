import puppeteer from "puppeteer-extra";
import {SearchKeyword} from "./question-list";


// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import {save} from "@/src/utils/save";

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

    //Register plugins before launching browser
    puppeteer.use(StealthPlugin())
    //puppeteer.use(AdblockerPlugin({blockTrackers: true}))

    //Launch browser
    globalThis.browser = await puppeteer.launch({
        headless: false,
        userDataDir: "./user-data",
        //modify
        executablePath:"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
    });

    // Server
    await import('./utils/Database/server')
    //const resultPage = await browser.newPage();
    //resultPage.goto("http://localhost:8080",{timeout:0})

    //auto save
    setInterval(function ()
    {
        save()
    },15000)

    //Question Loop
    const {QuestionLoop} = await import("./QuestionLoop")
    await QuestionLoop();


}
