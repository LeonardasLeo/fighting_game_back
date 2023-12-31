const jwt = require('jsonwebtoken')
const userDb = require('../modules/userSchema')
const bcrypt = require('bcrypt')
const resSend = (res, error, message, data) => {
    res.send({error, message, data})
}

module.exports = {
    authorizeRegister: async (req, res, next) => {
        const {username, character, passOne, passTwo} = req.body
        const userInDb = await userDb.findOne({username})
        if (!character) return resSend(res, true, 'Please select character', null)
        if (userInDb) return resSend(res, true, 'User already exists', null)
        if (username === '' || passOne === '' || passTwo === '') return resSend(res, true, 'Fields must not be empty', null)
        if (passOne !== passTwo) return resSend(res, true, 'Passwords must match', null)
        req.hash = await bcrypt.hash(passOne, 10)
        next()
    },
    authorizeLogin: async (req, res, next) => {
        const {username, password} = req.body
        if (username === '' || password === '') return resSend(res, true, 'Fields must not be empty', null)
        const userInDb = await userDb.findOne({username})
        if (userInDb){
            const isPasswordCorrect = await bcrypt.compare(password, userInDb.password)
            if (isPasswordCorrect){
                const user = {
                    username: userInDb.username,
                    password: userInDb.password,
                    character: userInDb.character
                }
                req.token = jwt.sign(user, process.env.JWT_SECRET)
                next()
            }else{
                resSend(res, true, 'Password incorrect', null)
            }
        }else{
            return resSend(res, true, 'User doesnt exist', null)
        }
    },
    authorize: (req, res, next) => {
        const {authorization} = req.headers
        jwt.verify(authorization, process.env.JWT_SECRET, async (err, data) => {
            if (err) return resSend(res, true, '401 authorization error', null)
            const user = await userDb.findOne({username: data.username})
            if (!user){
                return resSend(res, true, 'User not found in database', null)
            }
            req.user = data
            next()
        })
    },
    checkInventory: async (req, res, next) => {
        const {username} = req.user
        const userInDb = await userDb.findOne({username})
        if (!userInDb.inventory.includes('')) return resSend(res, true, 'Inventory full', null)
        next()
    },
    checkMoney: (req, res, next) => {
        const money = Number(req.params.money)
        if (money < 100) return resSend(res, true, 'Not enough money', null)
        next()
    }
}