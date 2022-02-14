import { getFormData, sendCharacter, socket } from "./client.js";

export function RenderLoginPage(data = []) {
    fetch('/Client/templates/login.mustache')
        .then((response) => response.text())
        .then((template) => {
        var rendered = Mustache.render(template,{names:data});
        document.getElementById('mainContainer').innerHTML = rendered;    
        document.getElementById('btnNewGame').addEventListener('click',()=>socket.emit('newRoom'))
    });
}
export function RenderCreateCharPage(data,errors) {
    fetch('/Client/templates/createChar.mustache')
        .then((response) => response.text())
        .then((template) => {
        var rendered = Mustache.render(template,{roomName:data,errors: errors});
        document.getElementById('mainContainer').innerHTML = rendered;    
        document.getElementById('formCreateChar').addEventListener('submit',(e)=>sendCharacter(getFormData(e,"formCreateChar")))
    });
}
export function RenderGamePage() {
    fetch('/Client/templates/game.mustache')
        .then((response) => response.text())
        .then((template) => {
        var rendered = Mustache.render(template);
        document.getElementById('mainContainer').innerHTML = rendered;    
    });
}

