const socket = io.connect('http://localhost:3000/');
let canvas,ctx;
socket.emit('getRoomNames')
socket.on('init',init)
socket.on('roomNames',receiveRoomNames);

function init(){
    ShowLoginPage();
}
function receiveRoomNames(roomNames){
    console.log(roomNames)
}