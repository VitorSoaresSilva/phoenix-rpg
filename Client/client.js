export const socket = io.connect("http://localhost:3000/")
import { RenderLoginPage } from './render.js';


socket.on('init', init)
socket.on('roomData',handleReceiveRoom)
socket.on('roomNames',handleReceiveRoomNames)

function init(message){
    console.log(message)
    RenderLoginPage()
}
function handleReceiveRoom(data){
    console.log(data)
}
function handleReceiveRoomNames(data){
    console.log(data)
    RenderLoginPage(data)
}