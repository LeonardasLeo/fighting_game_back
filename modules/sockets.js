const {Server} = require('socket.io')
const userDb = require('../modules/userSchema')
const {
    verifyToken,
    findUsersInDb,
    getSingleUserFromDb
} = require('../middleware/socketMiddleware')
const {ignore} = require("nodemon/lib/rules");

const rooms = {}
let onlineUsers = []

const random = (num, numToAdd) => {
    return Math.floor(Math.random() * num) + numToAdd
}

const filterUsers = (socket) => {
    let copy = [...onlineUsers]
    copy = copy.filter(x => x.socketId !== socket.id)
    socket.emit('getOnlineUsers', copy);
}

const setNextAttacker = (roomName, first, second) => {
    let currentAttacker = rooms[roomName].currentAttacker
    if (first === currentAttacker){
        return second
    }
    if (second === currentAttacker){
        return first
    }
}

const clearIntervals = (roomName) => {
    rooms[roomName].time = 20
    clearInterval(rooms[roomName].attackInterval)
    clearInterval(rooms[roomName].timerInterval)
}

function startInterval (roomName, first, second, io) {
    clearIntervals(roomName)
    let currentAttacker = rooms[roomName].currentAttacker
    rooms[roomName].attackInterval = setInterval(() => {
        currentAttacker = setNextAttacker(roomName, first, second)
        return io.to(roomName).emit('setAttacker', currentAttacker)
    }, 20000)
    rooms[roomName].timerInterval = setInterval(() => {
        if (rooms[roomName].time > 1){
            rooms[roomName].time -= 1
        }else{
            rooms[roomName].time = 20
        }
        return io.to(roomName).emit('timer', rooms[roomName].time)

    }, 1000)
}



module.exports = (server) => {
    const io = new Server((server),{
        cors: {
            origin: "*"
        }
    });

    io.on('connection',  (socket) => {
        socket.on('userConnected', async (token) => {
            const {username} = await verifyToken(token, socket)
            const user = await getSingleUserFromDb(username)
            socket.emit('getUserData', user)
        })
        socket.on('requestOnlineUsers', async (token) => {
                const data = await verifyToken(token, socket)
                const user = {...data, socketId: socket.id}
                const isDuplicateUser = onlineUsers.some(x => x.username === user.username)
                if (!isDuplicateUser){
                    onlineUsers.push({...user, status: 'idle'})
                }
                filterUsers(socket)
                setInterval(() => {
                    filterUsers(socket)
                }, 5000)

        })
        socket.on('invitePlayer', (data) => {
            const {from, to, roomName} = data
            const user = onlineUsers.find(x => x.socketId === from)
            socket.to(to).emit('invitationReceived', {from: user, to, roomName})
        })
        socket.on('invitationAcceptedClient', ({userWhoSent, roomName}) => {
            socket.to(userWhoSent.socketId).emit('invitationAcceptedServer', {roomName, first: userWhoSent.socketId, second: socket.id})
        })
        socket.on('joinRoom', ({roomName, id}) => {
            const user = onlineUsers.find(x => x.socketId === id)
            user.status = 'battle'
            socket.join(roomName)
            rooms[roomName] = {currentAttacker: '', time: 20, attackInterval: null, timerInterval: null}
        })
        socket.on('requestBattleUsers',  async ({roomName, userOne, userTwo}) => {
            const first = onlineUsers.find(x => x.socketId === userOne)
            const second = onlineUsers.find(x => x.socketId === userTwo)
            if (first && second){
                const users = await findUsersInDb(first.username, second.username)
                startInterval(roomName, userOne, userTwo, io)
                io.to(roomName).emit('getBattleUsers', users)
            }
        })
        socket.on('setWhoIsAttacking', ({roomName, first}) => {
            try {
                rooms[roomName].currentAttacker = first
                io.to(roomName).emit('setAttacker', rooms[roomName].currentAttacker)
            } catch (e) {
                console.log(e)
            }
        })
        socket.on('requestAttack', async ({roomName, firstUser, secondUser}) => {
            let firstUserMessage = ''
            let secondUserMessage = ''
            let currentAttacker
            const userOne = onlineUsers.find(x => x.username === firstUser.username)
            const userTwo = onlineUsers.find(x => x.username === secondUser.username)
            const calculateDamage = () => {
                const maxDamage = firstUser.selectedItems[0].damage.max
                const minDamage = firstUser.selectedItems[0].damage.min
                const swordDamage = random(maxDamage-minDamage+1, minDamage)
                let additionalDamage = 0
                firstUser.selectedItems[0].effects.forEach(effect => {
                    const chance = random(100,1)
                    if (chance <= effect.probability && effect.name === 'Critical Chance'){
                        additionalDamage = swordDamage
                        firstUserMessage += ' Critical'
                    }
                    if (chance <= effect.probability && effect.name === 'Life Steal Chance'){
                        additionalDamage = 1
                        firstUserMessage += ' Life steal'
                    }
                })
                return swordDamage + additionalDamage
            }
            const calculateAbsorbedDamage = (hitDamage) => {
                let absorbedDamage = 0
                const armour = secondUser.selectedItems[1]
                if (armour.tier !== undefined){
                    absorbedDamage = ((hitDamage*armour.armourPoints)/100).toFixed(0)
                    if (armour.effects){
                        armour.effects.forEach(effect => {
                            const chance = random(100,1)
                            if (chance <= effect.probability){
                                absorbedDamage = hitDamage
                                secondUserMessage = 'Dodge'
                            }
                        })
                    }
                    return Number(absorbedDamage)
                }else{
                    return Number(absorbedDamage)
                }
            }
            const hitDamage = calculateDamage()
            const absorbedDamage = calculateAbsorbedDamage(hitDamage)
            // if absorbed damage is 0, we just return hit damage, else we subtract hit
            const damageTaken = absorbedDamage === 0 ? hitDamage : hitDamage - absorbedDamage
            secondUser.health -= damageTaken
            // on attack we generate random gold for attacking user
            firstUser.gold += random(firstUser.selectedItems[0].maxGold, 1)
            // set messages that the effects of weapons and armour might've had
            firstUser.message = firstUserMessage
            secondUser.message = secondUserMessage
            // on attack if the opponents health less than 0, we set it to 0, emit battleWon and give attacker the gold to DB
            if (secondUser.health <= 0) {
                secondUser.health = 0
                await userDb.findOneAndUpdate({username: firstUser.username}, {$inc: {money: firstUser.gold}})
                userOne.status = 'idle'
                userTwo.status = 'idle'
                clearIntervals(roomName)
                io.to(roomName).emit('battleWon', {
                    first: firstUser,
                    second: secondUser,
                    message: `${firstUser.username} has won`
                })
                return io.socketsLeave(roomName)
            }
            //set next attacker, reset timer and emit timer and attacker
            currentAttacker = setNextAttacker(roomName, userOne.socketId, userTwo.socketId)
            rooms[roomName].time = 20
            rooms[roomName].currentAttacker = currentAttacker
            startInterval(roomName, firstUser, secondUser, io)

            // emit updated values
            io.to(roomName).emit('setAttacker', currentAttacker)
            io.to(roomName).emit('timer', rooms[roomName].time)
            io.to(roomName).emit('attack', {first: firstUser, second: secondUser, roomName, damage: damageTaken})

        })
        socket.on('pageLeft', ({roomName, firstUser, secondUser}) => {
            try {
                const userOne = onlineUsers.find(x => x.username === firstUser.username)
                const userTwo = onlineUsers.find(x => x.username === secondUser.username)
                userOne.status = 'idle'
                userTwo.status = 'idle'
                clearIntervals(roomName)
                io.to(roomName).emit('userLeftPage', `${firstUser.username} has left`)
                io.socketsLeave(roomName)
            }catch (err){
                console.log('no users to find')
            }
        })
        socket.on('requestPotionDrink', async ({user, item, roomName}) => {
            const hpToAdd = item.hp
            if (user.health !== 100 && user.health > 0){
                const userInDb = await userDb.findOneAndUpdate({_id: user._id, 'selectedItems.type': 'potion'}, {$set: {'selectedItems.$': {type: 'potion'}}}, {new: true})
                await userDb.findOneAndUpdate({_id: user._id, 'inventory.id': item.id}, {$set: {'inventory.$': ''}})
                if (user.health + hpToAdd > 100){
                    user.health = 100
                }else{
                    user.health += hpToAdd
                }
                user.selectedItems = userInDb.selectedItems
                io.to(roomName).emit('drinkPotion', user)
            }
        })
        socket.on('disconnect', () => {
            onlineUsers = onlineUsers.filter(x => x.socketId !== socket.id)
        })
    })
}