const jwt = require("jsonwebtoken");
const userDb = require("../modules/userSchema");
module.exports = {
    verifyToken: async (token, socket) => {
        let username
        let character
        jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
            if (err) return socket.emit('error', '401 authorization error')
            username = data.username
            character = data.character
        })
        const user = await userDb.findOne({username})
        if (!user) return socket.emit('error', 'Fatal: user not found')
        return {username, character}
    },
    getSingleUserFromDb: async (username) => {
        return userDb.findOne({username}, {password: 0});
    },
    findUsersInDb: async (usernameOne, usernameTwo) => {
        const first = await userDb.findOne({username: usernameOne}, {password: 0, inventory: 0})
        const second = await userDb.findOne({username: usernameTwo}, {password: 0, inventory: 0})
        return {first, second}
    }
}