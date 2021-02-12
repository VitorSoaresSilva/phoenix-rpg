const socket = io.connect('http://localhost:3000/');

socket.on('init',(message)=>{
    console.log(message)
})