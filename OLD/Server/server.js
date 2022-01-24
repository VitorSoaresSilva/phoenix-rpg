const PORT = process.env.PORT || 3000;
const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: {
        methods: ['GET', 'POST']
    }
})
const {makeId} = require('./utils')
const {GRID_SIZE, CANVAS_SIZE, FRAME_RATE} = require('./constants')
const {maps,nMaps} = require('./maps')
io.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
})

let rooms = [];
let players = [];
let bullets = [];
let roomState = {
    running: 'running',
    paused: 'paused',
    lobby: 'lobby'
};

io.on('connection', client => {
    let myRoom = '';
    console.log('New connection')
    client.emit('init', 'Hello world from Server')
    client.on('newRoom', handleNewRoom);
    client.on('getRoomNames', handleGetRooms);
    client.on('joinRoom', handleJoinRoom);
    client.on('ready',playerReady);
    client.on('tryCreatePlayer',tryCreatePlayer);
    client.on('keydown',handleKeyDown);
    client.on('keyup',handleKeyUp);

    function handleConnectToRoom(roomName) {
        client.join(roomName)
        myRoom = roomName;
        let room = getRoomByName(myRoom)
        let map = createMap()
        client.emit('roomData', room,map)
    }
    function tryCreatePlayer(playerData){
        let playersInRoom = getPlayersInRoom(myRoom);
        let playerWithSameName = playersInRoom.filter(player => player.name === playerData.name)
        if(playerWithSameName.length > 0){
            client.emit('invalidPlayer', 'Nome já foi escolhido');
        }else{
            let player = createNewPlayer(playerData);
            playersInRoom.push(player)
            io.in(myRoom).emit('lobby',playersInRoom);
        }
    }

    function handleNewRoom() {
        // cria um nome unico
        const name = makeId(5);
        rooms.map(room => {
            if (room.name === name) {
                handleNewRoom();
            }
        })
        //cria o estado inicial da room
        const newRoom = {
            name: name,
            gridSize: GRID_SIZE,
            canvasSize: CANVAS_SIZE,
            size: CANVAS_SIZE/GRID_SIZE,
            canvasColor: '#004545',
            curLevel: 0,
            gameState: roomState.lobby,
        }
        //adiciona a room à lista
        rooms.push(newRoom);
        //envia para o cliente os dados
        updateRooms();
        handleConnectToRoom(newRoom.name)
    }
    async function handleJoinRoom(roomName) {
        let ids = await io.in(roomName).allSockets()
        if (ids.size === 0) {
            client.emit('unknownGame')
            updateRooms();
            return;
        }
        handleConnectToRoom(roomName);
    }

    function handleGetRooms() {
        const allRoomNames = rooms.map(room => room.name)
        client.emit('roomNames', allRoomNames);
    }

    function updateRooms() {
        const allRoomNames = rooms.map(room => room.name)
        io.emit('roomNames', allRoomNames);
    }

    function createNewPlayer(playerData) {
        const newPlayer = {
            id: client.id,
            vel: {x: 0,y: 0},
            rot: {x: 0,y: 1},
            room: myRoom,
            ready: false,
            name: playerData.name
        }
        newPlayer.pos = getRandomPosition(),
        players.push(newPlayer);
        return newPlayer;
    }

    function getPlayer(clientId = client.id) {
        return players.filter(player => player.id === clientId)[0];
    }

    function getPlayersInRoom(roomName) {
        return players.filter(player => player.room === roomName)
    }

    function getRoomByName(roomName) {
        return rooms.filter(room => room.name === roomName)[0];
    }
    function getRandomPosition() {
        let room = getRoomByName(myRoom);
        const newPos = {
            x: Math.round(Math.random() * room.gridSize),
            y: Math.round(Math.random() * room.gridSize)
        }
        if(!isValidPosition(newPos)){
            getRandomPosition()
        }
        return newPos;
    }
    function isValidPosition(pos,curPos = {x:-1,y:-1}) {
        let arrPlayers = getPlayersInRoom(myRoom);
        let isCollidingWithPlayer = false;
        let isCollingWithWall = false;
        let isCollidingWithOutside = false;
        let isDiagonalWall = false;

        isCollidingWithPlayer = arrPlayers.some(player => pos.x === player.pos.x && pos.y === player.pos.y)

        isCollidingWithOutside = (pos.x >= GRID_SIZE || pos.y >= GRID_SIZE || pos.x < 0 || pos.y < 0);

        isCollingWithWall = nMaps[pos.y][pos.x];

        if(curPos.x > -1){
            isDiagonalWall = (nMaps[pos.y][curPos.x] && nMaps[curPos.y][pos.x]);
        }
        return (!isCollidingWithPlayer && !isCollidingWithOutside && !isCollingWithWall && !(isDiagonalWall));
    }
    function playerReady(){ // funciona mas vou mudar
        let myPlayer = getPlayer();
        let playersInRoom = getPlayersInRoom(myRoom);
        myPlayer.ready = !myPlayer.ready;
        let amountPlayersReady = 0;
        playersInRoom.map(player => amountPlayersReady += player.ready)
        if(amountPlayersReady === playersInRoom.length){
            let room = getRoomByName(myRoom);
            room.gameState = roomState.running;
            io.in(myRoom).emit("gameStart",room);
            gameStart();
        }else{
            io.in(myRoom).emit('lobby',playersInRoom);
        }
    }
    let intervalId = null;
    function stopGame(){
        clearInterval(intervalId);
        io.in(myRoom).emit("gamePaused");
    }
    function gameStart(){
        intervalId = setInterval(() => {
                gameLoop(); 
                io.in(myRoom).emit("state",{players: getPlayersInRoom(myRoom),room: getRoomByName(myRoom), bullets: bullets});
        }, 1000 / FRAME_RATE);
    }
    function gameLoop(){
        let playersInRoom = getPlayersInRoom(myRoom);
        let newArrBullets = bullets;
        bullets.map(bullet => {
            let newPos = {
                x: bullet.pos.x + bullet.vel.x,
                y: bullet.pos.y + bullet.vel.y
            }
            if(isValidPosition(newPos)){
                bullet.pos = newPos;
            }else{
                newArrBullets = bullets.filter(b => b.id != bullet.id)
            }
        })
        bullets = newArrBullets;
        playersInRoom.map(player =>{
            if(player.vel.x != 0 || player.vel.y != 0){
                let newPos = {
                    x: player.pos.x + player.vel.x,
                    y: player.pos.y + player.vel.y
                }
                if(isValidPosition(newPos,player.pos)){
                    player.pos = newPos;
                }
            }
        })
    }
    function createBullet(player){
        const bullet = {
            id: makeId(6),
            vel:{
                x:player.rot.x * 2,
                y: player.rot.y *2
            },
            pos:{
                x:player.pos.x + player.rot.x,
                y:player.pos.y + player.rot.y
            },
            autorId: player.id,
        }
        bullets.push(bullet);
    }
    function handleKeyDown(keycode) {
        let player = getPlayer();
        let newRot = {x:0,y:0}
        switch (keycode) {
            case 27:
                break;
            case 32:
                createBullet(player);
                    break;
            case 37:{ //left
                player.vel = {
                    x: player.vel.x + (-1), y: player.vel.y
                }
                newRot = { x: -1, y: 0 };
                player.rot.x = newRot.x;
                player.rot.y = newRot.y;
            break;
            }
            case 38: { //down
                player.vel = {
                    x:player.vel.x, y: player.vel.y + (-1)
                }
                newRot = { x:0, y: -1};
                player.rot.x = newRot.x;
                player.rot.y = newRot.y;
                break;
            }
            case 39: { //rigth
                player.vel = {
                    x:player.vel.x + (1), y: player.vel.y
                }
                newRot = { x:1, y: 0};
                player.rot.x = newRot.x;
                player.rot.y = newRot.y;
                break;
            }
            case 40: { //up
                player.vel = {
                    x:player.vel.x, y: player.vel.y + (1)
                }
                newRot = {x:0, y: 1}
                player.rot.x = newRot.x;
                player.rot.y = newRot.y;
                break;
            }
        }
    }

    function handleKeyUp(keycode) {
        let player = getPlayer();
        switch (keycode) {
            case 27:
                break;
            case 37: { //left
                player.vel = {
                    x: player.vel.x - (-1), y: player.vel.y
                }
                break;
            }
            case 38: { //down
                player.vel = {
                    x:player.vel.x, y: player.vel.y - (-1)
                }
                break;
            }
            case 39: { //rigth
                player.vel = {
                    x:player.vel.x - (1), y: player.vel.y
                }
                break;
            }
            case 40: { //up
                player.vel = {
                    x:player.vel.x, y: player.vel.y - (1)
                }
                break;
            }
        }
    }
    function createMap(){
        let map = {wall: [], gate:[]};
        for(let i = 0; i < nMaps.length; i++){
            for(let j = 0; j < nMaps[i].length; j++){
                if(nMaps[i][j] === 1){
                    map.wall.push({x:j, y:i})
                }
                else if(nMaps[i][j] === 2){
                    map.gate.push({x:j, y:i})
                }
            }
        }
        return map;
    }

    client.on('disconnect', () => {
        let player = getPlayer()
        //socket tinha um player?
        if (player) {
            //salvo a sala que ele tava
            let roomName = player.room;
            //removo o player dos players
            players = players.filter(x => x.id != player.id);
            //verifico se a sala ficou vazia
            if (getPlayersInRoom(roomName).length === 0) {
                rooms = rooms.filter(room => room.name !== roomName);
                stopGame()
                updateRooms();
            }
        }else if(myRoom){
            if (getPlayersInRoom(myRoom).length === 0) {
                rooms = rooms.filter(room => room.name !== myRoom);
                stopGame()
                updateRooms();
            }

        }
    })
})