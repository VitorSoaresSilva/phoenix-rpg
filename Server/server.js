const PORT = process.env.PORT || 3000;
const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: {
        methods: ['GET', 'POST']
    }
})
const { makeId } = require('./utils')
const { GRID_SIZE,CANVAS_SIZE, FRAME_RATE } = require('./constants')

io.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`)
})

const rooms = [];

io.on('connection',client => {
    console.log('New connection')
    client.emit('init','Hello world from Server')
    client.on('newRoom', handleNewRoom)




    function handleNewRoom(){
        // cria um nome unico
        const name = makeId(5);
        rooms.map(room=>{
            if(room.name === name){
                handleNewRoom();
            }
        })

        //cria o estado inicial da room
        const newRoom = {
            name: name,
            gridSize: GRID_SIZE,
            canvasSize: CANVAS_SIZE,
            canvasColor: '#004545',
        }

        //adiciona a room à lista
        rooms.push(newRoom);

        //envia para o cliente os dados
        client.emit('roomData',newRoom)
    }
})
