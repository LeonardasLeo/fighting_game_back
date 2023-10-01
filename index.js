const express = require('express')
const app = express()
const cors = require('cors')
const router = require('./router/router')
const mongoose = require("mongoose");
require('dotenv').config()
const bodyParser = require('body-parser')
const {createServer} = require('node:http')
const server = createServer(app)
require('./modules/sockets')(server)
app.use(bodyParser.json())
app.use(cors())
app.use('/', router)


mongoose.connect(process.env.DB_KEY)
    .then(res => console.log('Connected'))
    .catch(err => console.log('Error'))

server.listen(3001)