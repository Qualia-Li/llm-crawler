export function myStealth() {
    Array.from(document.querySelectorAll("*"))
        .map((el:Element)=>el.scroll({
        top: 50000,
        left: 50000,
        behavior: 'smooth'
    }))
}