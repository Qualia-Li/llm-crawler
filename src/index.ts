import puppeteer from "puppeteer";
import {SearchKeyword} from "./question-list";

declare global {
    var browser: import('puppeteer').Browser;
    var questionList: SearchKeyword[];
}

//Main
{
    //Load saved data
    await import("./question-list")

    //Launch browser
    globalThis.browser = await puppeteer.launch({
        headless: false,
        executablePath: `C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`,
        userDataDir: "./user-data",
    });

    // Server
    await import('./utils/Database/server')
    const resultPage = await browser.newPage();
    //resultPage.goto("http://localhost:8080",{timeout:0})

    //Question Loop
    const {QuestionLoop} = await import("./QuestionLoop")
    await QuestionLoop();
}
