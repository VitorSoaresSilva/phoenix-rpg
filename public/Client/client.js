// var socket = io();
export const socket = io()
import { RenderLoginPage,RenderCreateCharPage, RenderLobbyGamePage, RenderPlayersList, RenderEvenOddGamePage, RenderEvenOddSpecPage } from './render.js';


socket.on('init', init)
socket.on('roomData',handleReceiveRoom)
socket.on('roomNames',handleReceiveRoomNames)
socket.on('invalidCharacter',handleReceiveRoom)
socket.on('characterCreated',handleCharacterCreated)
socket.on('updatePlayers',handleUpdatePlayers)
socket.on('initializeGame',handleInitializeGame)
socket.on('spec_gameInitialize',handleSpecGameInitialize)
socket.on('youWon',handleWonGame)
socket.on('youLose',handleLoseGame)

function init(message){
    console.log(message)
    RenderLoginPage()
}
function handleReceiveRoom(data,errors = []){
    RenderCreateCharPage(data.name,errors)
}
function handleReceiveRoomNames(data){
    console.log(data)
    RenderLoginPage(data)
}
function handleCharacterCreated(){
    RenderLobbyGamePage()
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
    RenderEvenOddGamePage({type: data[socket.id]})
}
function handleWonGame(){
    console.log("I won!")
}
function handleLoseGame(){
    console.log("I lose!")
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