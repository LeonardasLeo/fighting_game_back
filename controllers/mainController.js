const userDb = require('../modules/userSchema')
const characters = require('../modules/characters')
const resSend = (res, error, message, data) => {
    res.send({error, message, data})
}

const {
    generateWeapon,
    generateArmour,
    generatePotion
} = require('../modules/itemData')

module.exports = {
    getCharacters: async (req, res) => {
        resSend(res, false, null, characters)
    },
    register: async (req, res) => {
        const {username, character} = req.body
        const hash = req.hash
        const inventory = []
        const selectedItems = [
            {
                type: 'weapon',
                image: 'https://i.imgur.com/XTNo7Hh.png',
                background: 'https://www.onlygfx.com/wp-content/uploads/2018/07/4-light-green-watercolor-background-3.jpg',
                tier: 'C',
                damage: {
                    min: 1,
                    max: 5
                },
                effectSlots: 0,
                effects: [],
                maxGold: 3
            },
            {type: 'armour'},
            {type: 'potion'}
        ]
        for (let i = 0; i < 12 ; i++) {
            inventory.push('')
        }
        const user = new userDb({
            username,
            password: hash,
            inventory,
            selectedItems,
            money: 100,
            character: character
        })
        for (let i = 0; i < characters.length; i++) {
            if (characters[i].image === character){
                characters[i].isTaken = true
                break
            }
        }
        user.save()
            .then(() => {
            resSend(res, false, 'saved user to db', null)
            })
            .catch(() => {
            resSend(res, false, 'failed to save user to db', null)
            })

    },
    login: async (req, res) => {
        const token = req.token
        resSend(res, false, 'login success', {token})
    },
    generateItems: async (req, res) => {
        const {username} = req.user
        await userDb.findOneAndUpdate({username}, {$inc: {money: -100}})
        const user = await userDb.findOne({username})
        resSend(res, false, null, {user, generatedItems: [generateWeapon(), generateArmour(), generatePotion()]})
    },
    takeItem: async (req, res) => {
        const {username} = req.user
        const item = req.body
        const user = await userDb.findOne({username}, {password: 0})
        const isAlreadyInInventory = user.inventory.find(x => x.id === item.id)
        if (isAlreadyInInventory){
            resSend(res, true, 'You cant take item twice', null)
        }else{
            await userDb.findOneAndUpdate({username, 'inventory': ''}, {$set: {'inventory.$': item}})
            const updatedUser = await userDb.findOne({username}, {password: 0})
            resSend(res, false, null, updatedUser)
        }
    },
    selectItem: async (req, res) => {
        const {username} = req.user
        const item = req.body
        if (item.type === 'weapon'){
            await userDb.findOneAndUpdate({username, 'selectedItems.type': 'weapon'}, {$set: {'selectedItems.$': item}})
            const user = await userDb.findOne({username})
            resSend(res, false, null, user)
        }
        if (item.type === 'armour'){
            await userDb.findOneAndUpdate({username, 'selectedItems.type': 'armour'}, {$set: {'selectedItems.$': item}})
            const user = await userDb.findOne({username})
            resSend(res, false, null, user)
        }
        if (item.type === 'potion'){
            await userDb.findOneAndUpdate({username, 'selectedItems.type': 'potion'}, {$set: {'selectedItems.$': item}})
            const user = await userDb.findOne({username})
            resSend(res, false, null, user)
        }
    },
    deleteItemFromInventory: async (req, res) => {
        const {username} = req.user
        const id = Number(req.params.id)
        const user = await userDb.findOne({username}, {password: 0})
        const itemToDelete = user.inventory.find(x => x.id === id)
        const isItemSelected = user.selectedItems.some((item) => Object.values(item).join('') === Object.values(itemToDelete).join(''))
        //If item is selected, delete from inventory and selectedItems
        if (isItemSelected){
            await userDb.findOneAndUpdate({username, 'selectedItems': itemToDelete}, {$set: {'selectedItems.$': {type: itemToDelete.type}}})
            await userDb.findOneAndUpdate({username, 'inventory.id': id}, { $set: {'inventory.$': ''}})
            const updatedUser = await userDb.findOne({username})
            return resSend(res, false, null, updatedUser)
        }
        //If not selected, delete from inventory
        await userDb.findOneAndUpdate({username, 'inventory.id': id}, { $set: {'inventory.$': ''}})
        const updatedUser = await userDb.findOne({username})
        resSend(res, false, null, updatedUser)
    }
}