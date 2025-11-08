export function myStealth() {
    Array.from(document.querySelectorAll("*"))
        .map((el)=>el.scroll({
        top: 500*Math.random(),
        left: 50000,
        behavior: 'smooth'
    }))
}