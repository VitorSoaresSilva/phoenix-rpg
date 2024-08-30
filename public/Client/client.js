// var socket = io();
export const socket = io()
import { RenderLoginPage,RenderCreateCharPage, RenderLobbyGamePage, RenderPlayersList, RenderEvenOddGamePage, RenderEvenOddSpecPage, RenderEvenOddResultPage } from './render.js';


const eventhandlers = {
    // "init" : init,
    "roomData" : handleReceiveRoom,
    "roomNames" : handleReceiveRoomNames,
    "invalidCharacter" : handleReceiveRoom,
    "openLobby" : handleLobby,
    "updatePlayers" : handleUpdatePlayers,
    "initializeGame" : handleInitializeGame,
    "spec_gameInitialize" : handleSpecGameInitialize,
    "youWon" : handleWonGame,
    "youLose" : handleLoseGame,
}

for(const eventHandler in eventhandlers){
    socket.on(eventHandler, eventhandlers[eventHandler])
}

// function init(message){
//     console.log(message)
//     RenderLoginPage()
// }
function handleReceiveRoom(data,errors = []){
    RenderCreateCharPage(data.name,errors)
}
function handleReceiveRoomNames(data){
    console.log(data)
    RenderLoginPage(data)
}
function handleLobby(data){
    RenderLobbyGamePage(data)
}
function handleSpecGameInitialize(data){
    console.log(data)
    RenderEvenOddSpecPage(data)
}
function handleUpdatePlayers(players){
    RenderPlayersList(players)
}
function handleInitializeGame(data){
    console.log("player chosen",data)
    RenderEvenOddGamePage(data[socket.id])
}
function handleWonGame(){
    console.log("I won!")
    RenderEvenOddResultPage({resultado: "venceu"});
}
function handleLoseGame(){
    console.log("I lose!")
    RenderEvenOddResultPage({resultado: "perdeu"});
}
export function getFormData(e,idForm){
    e.preventDefault();
    let form = document.getElementById(idForm)
    const obj = {};
    for (let index = 0; index < form.length; index++) {
        const element = form[index];
        if(element.name.length > 0 && element.value.length > 0){
            obj[element.name] = element.value;
        }
    }
    return obj
}
export function sendCharacter(data){
    socket.emit('newPlayer',data)
}