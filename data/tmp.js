import fs from "node:fs";

const txt = fs.readFileSync("./result.json").toString("utf-8")
/** @type string[] */
let a = JSON.parse(txt)
a.forEach((b,idx,arr)=>{
    const c = b.platforms["夸克"]
    if(c){
        /** @type string */
        const d = c[0]
        let newStr = ""
        d.split("\n").forEach(e=>{
            // console.log(e)
            if(e === "window.\\_q\\_wl\\_sc\\_undefined = Date.now();"
            || e.includes(".css.map")) {
                console.log("replaced:  " + e.slice(0,20) + "...")
                return
            };

            newStr += e
            arr[idx].platforms["夸克"][0] = newStr
        })
        // console.log(newStr)
    }
})
fs.writeFileSync("./result1.json", JSON.stringify(a))

