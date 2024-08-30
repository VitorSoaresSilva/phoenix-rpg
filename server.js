//server
const {makeId} = require('./Server/utils')
const express = require('express');
const http = require('http');
const { Server } = require('socket.io')
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server)

//RPG
const { PORT, GRID_SIZE, CANVAS_SIZE } = require('./Server/constants')
const {nMaps} = require('./Server/maps')

const { GameStatus } = require('./Server/Enums.js');
// const Enums = require('./Server/Enums.d.ts');

app.use(express.static(path.join(__dirname, '/public')))
app.get('/',(req,res)=>{
    res.sendFile(__dirname + "/public/Client/index.html");
})

server.listen(PORT, ()=> {
    console.log(`Server running on ${PORT}`);
})

// Data
/** Rooms
 * name: string(5),
 * gridSize: number,
 * canvasSize: number,
 * players: string[]
 */
let RoomsServer = new Map()

/** Players
 * roomName: string(5)
 * character: object
 */
let PlayersServer = new Map()





io.on('connection', client => {
    console.log('New Connection!')
    client.join("lobby")
    client.emit('roomNames')
    
    const eventHandlers = {
        'newRoom' : handleNewRoom, 
        'newPlayer' : handleNewPlayer, 
        'joinRoom' : handleJoinRoom
    }
    for(eventHandler in eventHandlers){
        client.on(eventHandler, eventHandlers[eventHandler])
    }

    require('./Server/evenOddGame')(io,client,RoomsServer,PlayersServer)
    updateRooms();
    
    function handleNewRoom(){
        const name = makeId(5);
        if(RoomsServer.has(name)){
            handleNewRoom();
            return;
        }
        const newRoom = {
            name: name,
            // gridSize: GRID_SIZE, //
            // canvasSize: CANVAS_SIZE,//
            // status: GameStatus.idle,//
            players: []
        };
        RoomsServer.set(name,newRoom)
        handleConnectToRoom(name)
        updateRooms()
    }
    function handleConnectToRoom(roomName){
        client.leave("lobby")
        addPlayerToRoom(roomName,client.id);
        client.emit('roomData',RoomsServer.get(roomName));
    }
    function addPlayerToRoom(roomName, socketId){
        let room = RoomsServer.get(roomName)
        if(!room) return;
        room.players.push(socketId)
        RoomsServer.set(roomName,room)
        PlayersServer.set(socketId,
            {
                roomName:roomName,
                character:{},//
                socketId
            });
        client.join("preRoom_" + roomName);
    }

    function updateRooms(){
        console.log("Update")
        const allRoomNames = Array.from(RoomsServer.keys())
        io.to("lobby").emit('roomNames',allRoomNames)
    }

    function updatePlayers(roomName){
        let room = RoomsServer.get(roomName)
        if(!room) return;
        let players = [];
        room.players.forEach(player =>{
            players.push(PlayersServer.get(player).character)
        })
        io.to("preRoom_" + roomName).emit('updatePlayers',players)
    }

    
    
    function handleNewPlayer(data){
        let player = PlayersServer.get(client.id)
        if(!player) return;
        let room = RoomsServer.get(player.roomName)
        
        if(!data.name || !data.name.length > 0){
            client.emit('invalidCharacter',room,[{message:'Name invalid'}]);
            return;
        }
        for(let i = 0; i< room.players.length; i++){
            if(PlayersServer.get(room.players[i])?.character.name == data.name){
                client.emit('invalidCharacter',room,[{message:'Name already in use'}]);
                return;
            }
        }
        player.character = {name: data.name}
        client.emit("openLobby")
        updatePlayers(room.name)
    }

    function handleJoinRoom(roomName){
        let room = RoomsServer.get(roomName)
        if(!room)return;
        handleConnectToRoom(room.name)
    }

    

    function removePlayerFromRoom(socketId){
        let player = PlayersServer.get(socketId)
        if(!player) return;
        let roomName = player.roomName;
        let room = RoomsServer.get(roomName)
        if(room.players.length > 1){
            for (let index = 0; index < room.players.length; index++) {
                if(room.players[index] == socketId){
                    room.players.splice(index,1);
                    break;
                }
            }
            updatePlayers(roomName)
        }else{
            RoomsServer.delete(roomName)
            updateRooms()
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

    client.on('disconnect',()=>{
        removePlayerFromRoom(client.id);
    })
})



