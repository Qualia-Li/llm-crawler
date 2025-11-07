import * as http from "node:http";

import {getDataJson} from "@/src/utils/pureObj";

const PORT = 8080;
http.createServer(async (req, res) => {
    let offset = parseInt(req.url?.split("?offset=")[1] || "0")

    res.setHeader(        'Content-Type', 'text/html; charset=utf-8'    );
    res.setHeader("Access-Control-Allow-Origin", "*");
    let questionListElement = global.questionList[offset];
    if(!questionListElement){res.end("no more")}
    else res.end(getDataJson(questionListElement));
}).listen(PORT)

console.log("Server started at http://localhost:" + PORT)