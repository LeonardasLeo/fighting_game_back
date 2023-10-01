const express = require('express')
const {
    register,
    login,
    getCharacters,
    generateItems,
    takeItem,
    selectItem,
    deleteItemFromInventory,
} = require('../controllers/mainController')

const {
    authorizeRegister,
    authorizeLogin,
    authorize,
    checkInventory,
    checkMoney
} = require('../middleware/middleware')

const router = express.Router()

router.get('/getCharacters', getCharacters)
router.post('/register', authorizeRegister, register)
router.post('/login', authorizeLogin, login)
router.post('/generateItems/:money', authorize, checkMoney, generateItems)
router.post('/takeItem', authorize, checkInventory, takeItem)
router.post('/selectItem', authorize, selectItem)
router.post('/deleteItemFromInventory/:id', authorize, deleteItemFromInventory)

module.exports = router