const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    username: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    inventory: {
        type: Array,
        require: true
    },
    selectedItems: {
        type: Array,
        required: true
    },
    money: {
        type: Number,
        require: true
    },
    character: {
        type: String,
        require: true
    }
})

const user = mongoose.model('fighting_game_users', userSchema)

module.exports = user