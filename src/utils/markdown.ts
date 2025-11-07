import TurndownService from "turndown"

const turndownService = new TurndownService({linkStyle:"referenced"});
export function toMD(html:string | void){
    return turndownService.turndown(html || "");
}