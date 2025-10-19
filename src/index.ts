import puppeteer from "puppeteer";
import {SearchKeyword} from "./question-list";

declare global {
    var browser: import('puppeteer').Browser;
    var questionList: SearchKeyword[];
}
const Main = async () => {
    //Launch browser
    globalThis.browser = await puppeteer.launch({
        headless: false,
        executablePath: `C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`,
        userDataDir: "./user-data",
    });

    //Question Loop
    await import("./question-list")
    const {QuestionLoop} = await import("./QuestionLoop")
    await QuestionLoop();
};

Main()/*.catch(function (er
){
    console.error(er)
    Main()
});*/

