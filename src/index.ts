import puppeteer from "puppeteer";
import { questionList, SearchKeyword } from "./question-list";
import { askQuark } from "./engines/askQuark";
import { askDeepseek } from "./engines/askDeepseek";
import { QuestionLoop } from "./QuestionLoop";

//DB init
const sqlite3 = verbose();
export const db = new sqlite3.Database("./sqlite3.db");
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS result (
        question TEXT PRIMARY KEY,
        answer TEXT,
        refer TEXT,
        engine TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS errorlog (
        question TEXT PRIMARY KEY,
        message TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

//Engines
const engines = {
    deepseek: askDeepseek,
    豆包: () => {
        //TODO
    },
    元宝: () => {
        //TODO
    },
    文心一言: () => {
        //TODO
    },
    夸克: askQuark,
    kimi: () => {
        //TODO
    },
};

export const errList: SearchKeyword[] = [];
const Main = async () => {
    //Launch browser
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: `C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`,
        userDataDir: "./user-data",
    });

    //Set up page


    //Question Loop
    await QuestionLoop(page, questionList);
    while (errList.length) {
        await QuestionLoop(page, errList);
    }

    //Close DB
    db.close(() => {
        console.log("DB closed.");
    });
};

Main();

