import TurndownService from "turndown"

const turndownService = new TurndownService({linkStyle:"referenced"});
export function toMD(html:string){
    return turndownService.turndown(html);
}