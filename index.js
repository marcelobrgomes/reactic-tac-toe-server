var app = require('express')()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

app.get('/', (req,res)=> {
    res.sendFile(__dirname + '/index.html');
})

var rooms = []

const joinRoom = client => {
    let room = getRoom();

    let player = getRoomNextPlayer(room)
    room.push({clientId: client.id, player: player})

    return room;
}

const getRoom = () => {
    if(rooms.length === 0) {
        rooms.push([])
        return rooms[0]
    }

    let nextIncompleteRoom = rooms.filter((room, i) => room.length < 2)

    if(nextIncompleteRoom.length > 0) {
        return nextIncompleteRoom[0]
    }

    rooms.push([])
    return rooms[rooms.length -1]
}

const exitRoom = (clientId) => {
    rooms.forEach(room => {
        client = room.find(client => client.clientId === clientId)
        if(client) {
            room.splice(client, 1)
        }
    })
}

const getRoomNextPlayer = (room) => {
    if(room.length === 0) {
        return 'X'
    }

    return room.find(client => client.player === 'X') ? 'O' : 'X'
}

const getPlayerRoom = (clientId) => {
    let playerRoom

    rooms.forEach(room => {
        client = room.find(client => client.clientId === clientId)
        if(client) {
            playerRoom = room
            return
        }
    })

    return playerRoom
}

io.on('connection', (client) => {
    client.on('join', () => {
        let room = joinRoom(client)
        let roomPlayer = room.find(roomPlayer => roomPlayer.clientId === client.id);
        
        console.log('rooms', rooms)
        console.log('current room', room)
        client.emit('playerConnected', {
            message: `Você é ${roomPlayer.player}. Aguardando oponente.`,
            player: roomPlayer.player
        })

        client.broadcast.emit('playerConnected', {
            message: roomPlayer.player === 'X' ? '' : `Sua vez`,
            player: roomPlayer.player,
            room: room
        })
    })

    client.on('play', (gameData) => {
        client.broadcast.emit('updateBoard', {
            gameArray: gameData.gameArray,
            nextPlayer: gameData.nextPlayer,
            message: 'Sua vez'
        })
    })

    client.on('gameOver', (gameData) => {
        //console.log(gameData)
        console.log('clientId', client.id)
        client.emit('youWin', {
            message: 'Você venceu'
        })

        let playerRoom = getPlayerRoom(client.id)
        let oponentClientId = playerRoom.filter(roomClient => roomClient.clientId !== client.id)[0]
        //console.log('oponentClientId', oponentClientId)
        client.broadcast.to(oponentClientId.clientId).emit('youLose', {
            message: 'Você perdeu'
        })
    })

    client.on('disconnect', () => {
        console.log('user disconnected', client.id)
        exitRoom(client.id)
        // io.emit("update", room[client.id] + " se desconectou.");
        
    })
})

http.listen(443, () => {
    console.log('listening port 443');
})