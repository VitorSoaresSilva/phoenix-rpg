const PORT = process.env.PORT || 3000;
const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: {
        methods: ['GET', 'POST']
    }
})
const {makeId} = require('./utils')
const {GRID_SIZE, CANVAS_SIZE, FRAME_RATE} = require('./constants')
const {maps} = require('./maps')
io.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
})

let rooms = [];
let players = [];
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
        client.emit('roomData', room,maps[room.curLevel])
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
            pos: getRandomPosition(),
            vel: {x: 0,y: 0},
            rot: {x: 0,y: 0},
            rotLocked:false,
            room: myRoom,
            ready: false,
            name: playerData.name
        }
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
        // ver se nao tem nenhum player
        // ver se nao tem obstaculo
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

        isCollingWithWall = maps[0].some(map => pos.x === map.x && pos.y === map.y)

        let wallDiagonal1 = {x: pos.x,y: curPos.y};
        let wallDiagonal2 = {x: curPos.x,y: pos.y};
        let diagonal1 = maps[0].some(map =>  map.x === wallDiagonal1.x && map.y === wallDiagonal1.y)
        let diagonal2 = maps[0].some(map =>  map.x === wallDiagonal2.x && map.y === wallDiagonal2.y)
        isDiagonalWall = (diagonal1 && diagonal2);

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
                io.in(myRoom).emit("state",{players: getPlayersInRoom(myRoom),room: getRoomByName(myRoom)});
        }, 1000 / FRAME_RATE);
    }
    function gameLoop(){
        let playersInRoom = getPlayersInRoom(myRoom);
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
    function handleKeyDown(keycode) {
        let player = getPlayer();
        let newPos = {x:0,y:0}
        switch (keycode) {
            case 27:
                break;
        case 37: { //left
            player.vel = {
                x: player.vel.x + (-1), y: player.vel.y
            }
            break;
        }
        case 38: { //down
            player.vel = {
                x:player.vel.x, y: player.vel.y + (-1)
            }
            break;
        }
        case 39: { //rigth
            player.vel = {
                x:player.vel.x + (1), y: player.vel.y
            }
            break;
        }
        case 40: { //up
            player.vel = {
                x:player.vel.x, y: player.vel.y + (1)
            }
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