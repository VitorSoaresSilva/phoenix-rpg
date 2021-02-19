const socket = io.connect('http://localhost:3000/');

const btnNewGame = document.getElementById('btnNewGame');

const loginOuterContainer = document.getElementById('loginOuterContainer');
const homeOuterContainer = document.getElementById('homeOuterContainer');
const createCharContainer = document.getElementById('createCharContainer');
const lobbyContainer = document.getElementById('lobbyContainer');

const tableRoomNames = document.getElementById('tableRoomNames');
const tablePlayersInLobby = document.getElementById('tablePlayersInLobby');

const btnCreateChar = document.getElementById('btnCreateChar');
const btnReady = document.getElementById('btnReady');

const createCharForm = document.getElementById('createCharForm');

btnNewGame.addEventListener('click',()=>socket.emit('newRoom'))
btnCreateChar.addEventListener('click',formCreateChar)
btnReady.addEventListener('click',changeReady)
const PLAYER_COLOR = '#00ff00';
const OTHER_PLAYER_COLOR = '#ff0000';
let maps = [];
let canvas,ctx;
canvas = document.getElementById('canvas');
ctx = canvas.getContext('2d'); 

socket.emit('getRoomNames')
socket.on('roomData',receiveRoomData);
socket.on('roomNames',receiveRoomNames);
socket.on('unknownGame',unknownGame);
socket.on('lobby',lobby);
socket.on('invalidPlayer',invalidPlayer);
socket.on('gameStart',gameStart);
socket.on('state',state);
let removeListener = null;
// código encontrado no https://stackoverflow.com/a/60715758/15208728
const onKeyPress = (onPress,onRelease, target = window) => {
    // persistent "store" to track what keys are being pressed
    let pressed = {};
    // whenever a keydown event is fired ontarget element
    const onKeyDown = (event) => {
        // if key isn't already pressed, run onPress
        if (!pressed[event.which]){
            onPress(event);
        }
        // add key to store
        pressed = { ...pressed, [event.which]: true };
    };
    // whenever a keyup event is fired on the window element
    const onKeyUp = (event) => {
        const { [event.which]: id, ...rest } = pressed;
        // remove key from store
        pressed = rest;
        onRelease(event)
    };
    // add listeners
    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);

    // return a function that can be called to remove listeners
    return () => {
        target.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
    };
};
// const removeListener = onKeyPress(keydown,keyup); // adiciona a função
// removeListener(); // remove

function keydown(e){
    socket.emit('keydown',e.keyCode)
    //emit
}
function keyup(e){
    socket.emit('keyup',e.keyCode)
    //emit
}
function state(data){
    renderScreen(data.room);
    renderPlayers(data.players,data.room.size);
}
function renderPlayers(players,size){
    players.map((player)=>{
        if(player.id == socket.id){
            ctx.fillStyle = PLAYER_COLOR;
        }else{
            ctx.fillStyle = OTHER_PLAYER_COLOR;
        }
        ctx.fillRect(player.pos.x * size, player.pos.y * size, size , size )
    })
}
function renderScreen(roomData){
    canvas.width = canvas.height = roomData.canvasSize;
    ctx.fillStyle = roomData.canvasColor;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    for(let i = 0; i < maps.length; i++){
        for(let j = 0; j < maps[i].length; j++){
            if(maps[i][j] == 1){
                ctx.fillStyle = '#fff';
                ctx.fillRect(j * roomData.size, i * roomData.size, roomData.size , roomData.size )
            }else if(maps[i][j] == 2){
                ctx.fillStyle = '#454500';
                ctx.fillRect(j * roomData.size, i * roomData.size, roomData.size , roomData.size )
            }
        }
    }
}

function gameStart(roomData){
    changeActiveScreen(homeOuterContainer);
    renderScreen(roomData);
    removeListener = onKeyPress(keydown,keyup); // adiciona a função
}
function changeActiveScreen(screen){
    createCharContainer.style.display = 'none';
    loginOuterContainer.style.display = 'none';
    lobbyContainer.style.display = 'none';
    homeOuterContainer.style.display = 'none';

    screen.style.display = 'flex';
}


function changeReady(){
    if(btnReady.value === 'pronto'){
        btnReady.value = 'cancelar';
        btnReady.innerHTML = 'Cancelar';
        btnReady.setAttribute("class",'btn btn-danger');
        socket.emit('ready')
    }else if(btnReady.value === 'cancelar'){
        btnReady.value = 'pronto';
        btnReady.innerHTML = 'Pronto';
        btnReady.setAttribute("class",'btn btn-success');
        socket.emit('ready')
    }
}

function lobby(playersData){
    if(playersData.filter(player => player.id === socket.id).length > 0){
        changeActiveScreen(lobbyContainer)
        tablePlayersInLobby.innerHTML = '';
        playersData.map( player => {
            var row = tablePlayersInLobby.insertRow(0)
            var cell1 = row.insertCell(0)
            var cell2 = row.insertCell(1)
            cell1.innerHTML = player.name;
            cell2.innerHTML = player.ready;
        })
    }
}
function receiveRoomData(roomData,map){
    maps = map;
    if(roomData.gameState === 'lobby'){
        changeActiveScreen(createCharContainer);
    }else if(roomData.gameState === 'running'){
        changeActiveScreen(homeOuterContainer);
        alert('jogo já começou, modo spec ativado')
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        canvas.width = canvas.height = roomData.canvasSize;
        ctx.fillStyle = roomData.canvasColor;
        ctx.fillRect(0,0,canvas.width,canvas.height)
    }
}

function receiveRoomNames(roomNames){
    if(getComputedStyle(loginOuterContainer).display === 'flex'){
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
}

function unknownGame(){
    alert("Esta sala nao existe mais")
}

function formCreateChar(e){
    e.preventDefault();
    const obj = {};
    for (let index = 0; index < createCharForm.length; index++) {
        const element = createCharForm[index];
        obj[element.name] = element.value;
    }
    socket.emit('tryCreatePlayer',obj)
}

function invalidPlayer(message){
    alert(message);
    for (let index = 0; index < createCharForm.length; index++) {
        createCharForm[index].value = null;
    }
}