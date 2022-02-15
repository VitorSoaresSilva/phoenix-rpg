// var socket = io();
export const socket = io()
import { RenderLoginPage,RenderCreateCharPage, RenderGamePage, RenderPlayersList } from './render.js';


socket.on('init', init)
socket.on('roomData',handleReceiveRoom)
socket.on('roomNames',handleReceiveRoomNames)
socket.on('invalidCharacter',handleReceiveRoom)
socket.on('characterCreated',handleCharacterCreated)
socket.on('updatePlayers',handleUpdatePlayers)

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
    RenderGamePage()
}
function handleUpdatePlayers(players){
    RenderPlayersList(players)
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