const mongoose = require('mongoose')
const Schema = mongoose.Schema

const characterSchema = new Schema({
    image: {
        type: String,
        require: true
    },
    isTaken: {
        type: Boolean,
        require: true
    }
})

const character = mongoose.model('fighting_game_characters', characterSchema)

module.exports = character