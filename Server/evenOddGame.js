// const { PlayersServer, RoomsServer } = require("../server")

module.exports = function (io,client,RoomsServer,PlayersServer) {
    client.on('startGame',handleStartGame)
    client.on('evenOdd_choosed_value',handleChoosedValue)
    function handleStartGame(){
        let player = PlayersServer.get(client.id);
        if(!player) return;
        let room = RoomsServer.get(player.roomName);
        if(!room) return;
        let playerOneIndex;
        let playerTwoIndex;
        if(room.players.length == 2){
            playerOneIndex = Math.floor(Math.random() * room.players.length);
            playerTwoIndex = (playerOneIndex + 1) % 2;
        }
        else if(room.players.length > 2){
            playerOneIndex = Math.floor(Math.random() * room.players.length);
            playerTwoIndex = Math.floor(Math.random() * room.players.length);
            while(playerTwoIndex === playerOneIndex){
                playerTwoIndex = Math.floor(Math.random() * room.players.length);
            }
        }else{
            io.to(room.name).emit('notEnoughPlayers')
            return;
        }
        
/**
 * Spec need
 * 
 * Name of the player in game
 * Which player wins with which result
 * {data: [
 *  {name,type},
 *  {name,type}
 * ]}
 */


        let playerOne = PlayersServer.get(room.players[playerOneIndex])
        let playerTwo = PlayersServer.get(room.players[playerTwoIndex])
        io.in([playerOne.socketId,playerTwo.socketId]).socketsJoin("game_" + room.name);
        io.in([playerOne.socketId,playerTwo.socketId]).socketsLeave("preRoom_" + room.name);
        let dataToPlayers = {};
        dataToPlayers[playerOne.socketId] = { type: "odd", typeDescription: "ímpar" };
        dataToPlayers[playerTwo.socketId] = { type: "even", typeDescription: "par"};
        io.to('game_' + room.name).emit('initializeGame',dataToPlayers)
        
        let specData = {
            playersInGame:[
                {
                    name: playerOne.character.name,
                    type: "odd",
                    typeDescription: "ímpar"
                },
                {
                    name: playerTwo.character.name,
                    type: "even",
                    typeDescription: "par"
                }
            ],
            result: null
        };
        io.to('preRoom_' + room.name).emit('spec_gameInitialize',specData)
        room.game = {
            odd: {
                player: playerOne.socketId,
                valueChoosed: null,
            },
            even: {
                player: playerTwo.socketId,
                valueChoosed: null,
            }
        }
    }
    function handleChoosedValue(value){
        let player = PlayersServer.get(client.id);
        if(!player) return;
        let room = RoomsServer.get(player.roomName);
        if(!room) return;
        console.log(room.game)
        
        if(room.game.odd.player === client.id){
            if(room.game.odd.valueChoosed === null){
                room.game.odd.valueChoosed = value;
            }else{
                console.log("cannot change")
                // emit "cannot change"
                return;
            }
        }else if(room.game.even.player === client.id){
            if(room.game.even.valueChoosed === null){
                room.game.even.valueChoosed = value;
            }else{
                console.log("cannot change")
                // emit "cannot change"
                return;    
            }
        }else{
            console.log("not a player")
            // not a player
        }
        if(room.game.even.valueChoosed != null && room.game.odd.valueChoosed != null){ 
            let result = (room.game.even.valueChoosed + room.game.odd.valueChoosed) % 2;
            console.log("someone won: ",result,room.game.odd.player,room.game.even.player)
            var winner = {};
            var loser = {};
            if(result === 0){
                io.to(room.game.even.player).emit("youWon")
                io.to(room.game.odd.player).emit("youLose")
                winner = room.game.even.player.character
                loser = room.game.odd.player.character
            }else{
                io.to(room.game.odd.player).emit("youWon")
                io.to(room.game.even.player).emit("youLose")
                winner = room.game.odd.player.character
                loser = room.game.even.player.character
            }
            let specData = {
                result: {game: "Par ou impar",winner, loser}
            };
            
            io.in([room.game.even.player,room.game.odd.player]).socketsLeave("game_" + room.name);
            io.in([room.game.even.player,room.game.odd.player]).socketsJoin("preRoom_" + room.name);
            io.to('preRoom_' + room.name).emit('openLobby',specData)
        }
    }
}
