const { PORT, GRID_SIZE, CANVAS_SIZE } = require('./Server/constants')
const {makeId} = require('./Server/utils')
const {nMaps} = require('./Server/maps')

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io')
const io = new Server(server)
const path = require('path');

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
let rooms = new Map()

/** Players
 * roomName: string(5)
 * character: object
 */
let players = new Map()

io.on('connection', client => {
    console.log('New Connection!')
    client.join("lobby")
    client.emit('init','Hello from server')
    client.on('newRoom',handleNewRoom)
    client.on('newPlayer',handleNewPlayer)
    updateRooms();
    
    function handleNewRoom(){
        const name = makeId(5);
        if(rooms.has(name)){
            handleNewRoom();
            return;
        }
        const newRoom = {
            name: name,
            gridSize: GRID_SIZE,
            canvasSize: CANVAS_SIZE,
            players: []
        };
        rooms.set(name,newRoom)
        handleConnectToRoom(name)
        updateRooms()
    }
    function updateRooms(){
        const allRoomNames = Array.from(rooms.keys())
        io.to("lobby").emit('roomNames',allRoomNames)
    }
    function handleConnectToRoom(roomName){
        client.leave("lobby")
        addPlayerToRoom(roomName,client.id);
        client.emit('roomData',rooms.get(roomName));
    }
    function handleNewPlayer(data){
        let player = players.get(client.id)
        let room = rooms.get(player.roomName)
        
        if(!data.name || !data.name.length > 0){
            client.emit('invalidCharacter',room,[{message:'Name invalid'}]);
            return;
        }
        for(let i = 0; i< room.players.length; i++){
            if(players.get(room.players[i])?.character.name == data.name){
                client.emit('invalidCharacter',room,[{message:'Name already in use'}]);
                return;
            }
        }
        player.character = {name: data.name}
        client.emit("characterCreated")
    }
    function addPlayerToRoom(roomName, socketId){
        let room = rooms.get(roomName)
        if(!room) return;
        room.players.push(socketId)
        rooms.set(roomName,room)
        players.set(socketId,
            {
                roomName:roomName,
                character:{}
            });
        client.join("preRoom_" + roomName);
    }
    function removePlayerFromRoom(socketId){
        let player = players.get(socketId)
        if(!player) return;
        let roomName = player.roomName;
        let room = rooms.get(roomName)
        if(room.players.length > 1){
            for (let index = 0; index < room.players.length; index++) {
                if(room.players[index] == socketId){
                    room.players.splice(index,1);
                    break;
                }
            }
        }else{
            rooms.delete(roomName)
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



