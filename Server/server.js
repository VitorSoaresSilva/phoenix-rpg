const { PORT, GRID_SIZE, CANVAS_SIZE } = require('./constants')
const {makeId} = require('./utils')
const http = require('http').createServer();
const {nMaps} = require('./maps')
const io = require('socket.io')(http,{
    cors: {
        methods: ['GET','POST'],
    }
})

io.listen(PORT, ()=> {
    console.log(`Server running on ${PORT}`);
})

// Data
let rooms = new Map()
let players = new Map()

io.on('connection', client => {
    console.log('New Connection!')
    client.emit('init','Hello from server')
    client.on('newRoom',handleNewRoom)
    updateRooms();

    function handleNewRoom(){
        console.log("handle new room")
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
        updateRooms()
        handleConnectToRoom(name)
    }
    function updateRooms(){
        
        const allRoomNames = Array.from(rooms.keys())
        io.emit('roomNames',allRoomNames)
    }
    function handleConnectToRoom(roomName){
        client.join(roomName);
        let map = createMap();
        client.emit('roomData',rooms.get(roomName),map);

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
        //disconnect; remove empty room
    })
})
/**
    {
        name: "",
        game: "",
        status: ""
        players: []
    }



 */



