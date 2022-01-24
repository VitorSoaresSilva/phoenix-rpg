import { socket } from "./client.js";

export function RenderLoginPage() {
    fetch('./templates/login.mustache')
        .then((response) => response.text())
        .then((template) => {
        var rendered = Mustache.render(template);
        document.getElementById('mainContainer').innerHTML = rendered;    
        document.getElementById('btnNewGame').addEventListener('click',()=>socket.emit('newRoom'))
        
    });
}

