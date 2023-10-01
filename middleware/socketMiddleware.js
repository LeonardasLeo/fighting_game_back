const jwt = require("jsonwebtoken");
const userDb = require("../modules/userSchema");
module.exports = {
    verifyToken: (token, socket) => {
        let username
        let character
        jwt.verify(token, process.env.JWT_SECRET, async (err, data) => {
            if (err) return socket.emit('error', 'error')
            username = data.username
            character = data.character
        })
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