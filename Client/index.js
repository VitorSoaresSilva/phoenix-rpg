const socket = io.connect('http://localhost:3000/');

const btnNewGame = document.getElementById('btnNewGame');

const loginOuterContainer = document.getElementById('loginOuterContainer');
const homeOuterContainer = document.getElementById('homeOuterContainer');
const tableRoomNames = document.getElementById('tableRoomNames');
const btnGetData = document.getElementById('btnGetData');

btnNewGame.addEventListener('click',()=>socket.emit('newRoom'))
btnGetData.addEventListener('click',()=>socket.emit('getData'))

let canvas,ctx;
socket.emit('getRoomNames')

socket.on('roomData',receiveRoomData);
socket.on('roomNames',receiveRoomNames);
socket.on('unknownGame',unknownGame);
socket.on('newPlayer',getPlayer);
socket.on('data',(data)=>{console.log(data)});

function getPlayer(playerData){
    console.log(playerData);
}

function receiveRoomData(roomData){
    homeOuterContainer.style.display = 'flex';
    loginOuterContainer.style.display = 'none';
    console.log(roomData)
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    canvas.width = canvas.height = roomData.canvasSize;
    ctx.fillStyle = roomData.canvasColor;
    ctx.fillRect(0,0,canvas.width,canvas.height)
}

function receiveRoomNames(roomNames){
    tableRoomNames.innerHTML = '';
    roomNames.map( name => {
        var btn = document.createElement('button');
        btn.setAttribute('type', 'button');
        btn.setAttribute('class','btn btn-info');
        btn.innerHTML = 'Entrar'
        btn.addEventListener('click',()=>socket.emit('joinRoom',name))
        var row = tableRoomNames.insertRow(0)
        var cell1 = row.insertCell(0)
        var cell2 = row.insertCell(1)
        cell1.innerHTML = name;
        cell2.appendChild(btn);
    })
}
function unknownGame(){
    alert("Esta sala nao existe mais")
}