import puppeteer, {Browser} from "puppeteer";
import {questionList} from "./question-list";

const Main = async () => {
    //Launch browser
    globalThis.browser = await puppeteer.launch({
        headless: false,
        executablePath: `C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`,
        userDataDir: "./user-data",
    });

    //Question Loop
    const {QuestionLoop} = await import("./QuestionLoop")
    await QuestionLoop(questionList);
};

declare global {
    interface globalThis {
        browser: Browser;
    }
}

Main();

