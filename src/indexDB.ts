import puppeteer from "puppeteer-extra";

// Add stealth plugin
import StealthPlugin from "puppeteer-extra-plugin-stealth";

declare global {
    var browser: import('puppeteer').Browser;
}

//Main
const main = async () => {
    //Load env
    await import("dotenv/config");

    //Register plugins before launching browser
    puppeteer.use(StealthPlugin());

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

    //Question Loop (Database Version)
    const {QuestionLoopDB} = await import("./QuestionLoopDB");
    await QuestionLoopDB();
};

const retry = async (e = "Start" as any) => {
    console.log("Retried because of the err below:");
    console.error(e);
    await main().catch(retry);
};

await retry();
