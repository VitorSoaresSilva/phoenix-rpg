import { getFormData, socket } from "./client.js";

export function RenderLoginPage(data = []) {
    fetch('./templates/login.mustache')
        .then((response) => response.text())
        .then((template) => {
        var rendered = Mustache.render(template,{names:data});
        document.getElementById('mainContainer').innerHTML = rendered;    
        document.getElementById('btnNewGame').addEventListener('click',()=>socket.emit('newRoom'))
    });
}
export function RenderCreateCharPage(data) {
    fetch('./templates/createChar.mustache')
        .then((response) => response.text())
        .then((template) => {
        var rendered = Mustache.render(template,{roomName:data});
        document.getElementById('mainContainer').innerHTML = rendered;    
        document.getElementById('formCreateChar').addEventListener('submit',(e)=>console.log(getFormData(e,"formCreateChar")))
    });
}

