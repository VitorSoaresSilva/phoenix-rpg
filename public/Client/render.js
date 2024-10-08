import { getFormData, sendCharacter, socket } from "./client.js";

export function RenderLoginPage(data = []) {
    fetch('/Client/templates/login.mustache')
        .then((response) => response.text())
        .then((template) => {
        var rendered = Mustache.render(template,{names:data});
        document.getElementById('mainContainer').innerHTML = rendered;    
        document.getElementById('btnNewGame').addEventListener('click',()=>socket.emit('newRoom'))
        data.forEach(element => {
            document.getElementById("btnJoin_" + element).addEventListener('click',()=>socket.emit('joinRoom',element))
        });
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
export function RenderLobbyGamePage(data = {}) {
    fetch('/Client/templates/lobbyGame.mustache')
    .then((response) => response.text())
    .then((template) => {
        var rendered = Mustache.render(template);
        document.getElementById('mainContainer').innerHTML = rendered;    
        document.getElementById("btnPlayGame").addEventListener('click',()=>socket.emit('startGame'))
        document.getElementById("btnPlayGameRockPaperScissors").addEventListener('click',()=>socket.emit('startRockPaperScissors'))
    });
}
export function RenderPlayersList(players) {
    fetch('/Client/templates/playersList.mustache')
        .then((response) => response.text())
        .then((template) => {
        var rendered = Mustache.render(template,{players:players});
        document.getElementById('sideContainerRight').innerHTML = rendered;    
    });
}

export function RenderEvenOddGamePage(data) {
    console.log("data",data)
    fetch('/Client/templates/gameEvenOdd.mustache')
    .then((response) => response.text())
    .then((template) => {
        var rendered = Mustache.render(template,{typeDescription:data.typeDescription});
        document.getElementById('mainContainer').innerHTML = rendered; 
        for(let i = 0; i < 10; i++){
            document.getElementById("btnEvenOdd_" + i).addEventListener('click',()=>socket.emit('evenOdd_choosed_value',i))
        }   
    });
}
export function RenderEvenOddSpecPage(data) {
    console.log(data)
    fetch('/Client/templates/specEvenOdd.mustache')
    .then((response) => response.text())
    .then((template) => {
        var rendered = Mustache.render(template,{playerOne:data.playersInGame[0],playerTwo: data.playersInGame[1], result: data.result});
        document.getElementById('mainContainer').innerHTML = rendered; 
    });
}

export function RenderEvenOddResultPage(data){
    console.log("Result", data)
    fetch('/Client/templates/resultEvenOdd.mustache')
    .then((response) => response.text())
    .then((template) => {
        var rendered = Mustache.render(template,{resultado: data.resultado});
        document.getElementById('mainContainer').innerHTML = rendered; 
        document.getElementById("btnPlayGame").addEventListener('click',()=>socket.emit('startGame'))
    })

}