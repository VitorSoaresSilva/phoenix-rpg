const { PORT, GRID_SIZE, CANVAS_SIZE } = require('./constants')
const {makeId} = require('./utils')
const http = require('http').createServer();

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
        }
        const newRoom = {
            name: name,
            gridSize: GRID_SIZE,
            canvasSize: CANVAS_SIZE,
            players: []
        };
        rooms.set(name,newRoom)
        updateRooms()
        client.emit("roomData",rooms.get(name))
    }
    function updateRooms(){
        
        const allRoomNames = Array.from(rooms.keys())
        io.emit('roomNames',allRoomNames)
    }
})
/**
    {
        name: "",
        game: "",
        status: ""
        players: []
    }



 */



