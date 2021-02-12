const socket = io.connect('http://localhost:3000/');

const btnNewGame = document.getElementById('btnNewGame');

const loginOuterContainer = document.getElementById('loginOuterContainer');
const homeOuterContainer = document.getElementById('homeOuterContainer');

btnNewGame.addEventListener('click',()=>socket.emit('newRoom'))

let canvas,ctx;


socket.on('roomData',receiveRoomData);
// socket.on('init',initGame)





function receiveRoomData(roomData){
    homeOuterContainer.style.display = 'flex';
    loginOuterContainer.style.display = 'none';


    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    canvas.width = canvas.height = roomData.canvasSize;
    ctx.fillStyle = roomData.canvasColor;
    ctx.fillRect(0,0,canvas.width,canvas.height)

}   
// function initGame(){

// }