import puppeteer from "puppeteer";
import { questionList } from "./question-list";
import fs from "node:fs/promises";
import { askDeepseek } from "./askDeepseek";

const results: {
    question: string;
    answer: string /* html */;
    refer?: string[] /* url */;
}[] = [];

const Main = async () => {
    //Launch browser
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: `C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`,
        userDataDir: "./user-data",
    });

    const page = await browser.newPage();

    //Question Loop
    for (const question of questionList) {
        const answer = await askDeepseek(page, question);
        results.push({
            question: question,
            answer: answer,
            //refer:answer.match("^(https?|ftp):\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(:[0-9]{1,5})?(\/\S*)?$")?.groups
        });
        console.log(
            answer.match(
                "^(https?|ftp)://[a-zA-Z0-9-.]+.[a-zA-Z]{2,}(:[0-9]{1,5})?(/S*)?$"
            )
        );
        //localforage.setItem("results", results);
        fs.writeFile("./results.json", JSON.stringify(results));
    }
};

Main();
