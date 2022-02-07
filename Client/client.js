export const socket = io.connect("http://localhost:3000/")
import { RenderLoginPage,RenderCreateCharPage } from './render.js';


socket.on('init', init)
socket.on('roomData',handleReceiveRoom)
socket.on('roomNames',handleReceiveRoomNames)

function init(message){
    console.log(message)
    RenderLoginPage()
}
function handleReceiveRoom(data,map){
    console.log(data,map)
    RenderCreateCharPage(data.name)
}
function handleReceiveRoomNames(data){
    console.log(data)
    RenderLoginPage(data)
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