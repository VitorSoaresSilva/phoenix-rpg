const PORT = process.env.PORT || 3000;
const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: {
        methods: ['GET', 'POST']
    }
})

io.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`)
})

io.on('connection',client => {
    console.log('New connection')
    client.emit('init','Hello world from Server')
})
