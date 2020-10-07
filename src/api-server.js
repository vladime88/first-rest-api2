import express from 'express'
import bodyParser from 'body-parser'

// import sequelize connector and User and Message models instances
import { sequelize, User, Message } from './models/db.js'

// Test if database connection is OK else exit
try {
    await sequelize.authenticate() // try to authentificate on the database
    console.log('Connection has been established successfully.')
    await User.sync({ alter: true }) // modify users table schema is something changed
    await Message.sync({ alter: true }) // same for messages table
} catch (error) {
    console.error('Unable to connect to the database:', error)
    process.exit(1)
}

// Local network configuration
const IP = '192.168.1.13'
const PORT = 7777

const app = express()

// A middle for checking if an api key is provided by the user
// in the Authorization header
const getApiKey = async (req, res, next) => {
    const key = req.headers.authorization
    if (!key) {
        res.status(403).json({ code: 403, data: 'No api token' })
    } else {
        next()
    }
}

// A middleware for checking if an api token is valid
// and is still active.
// if Ok the user performing the request is attached to the req object.
const validateApiKey = async (req, res, next) => {
    const key = req.headers.authorization
    try {
        const user = await User.findAll({
            attributes: ['username', 'email'],
            where: { api_key: key },
        })
        // check if empty results then not found
        if (user.length === 0) {
            res.status(403).json({ code: 403, data: 'Invalid api token' })
        } else {
            console.log('USER:', user)
            req.user = user
            next()
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
}

app.use(bodyParser.json()) // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: false })) // to support URL-encoded bodies

/*
Endpoint for user registration. 
input:
{
    "username": string,
    "email": string
}
*/
app.post('/register', async (req, res) => {
    //check username n'et pas null, pareil pour email
    const username = req.body.username
    const email = req.body.email
    try {
        const user = await User.create({ username: username, email: email })
        res.json({ code: 200, data: user })
    } catch (e) {
        console.log('Error', e)
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

app.use(getApiKey)
app.use(validateApiKey)

// GET user by id
app.get('/id/:id', async (req, res) => {
    const id = req.params.id
    try {
        const user = await User.findAll({
            attributes: ['username', 'email'],
            where: { id: id },
        })
        if (user.length === 0) {
            res.status(404).json({ code: 404, data: 'user not found' })
        } else {
            res.json({ code: 200, data: user })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

// GET user by username
app.get('/username/:username', async (req, res) => {
    const username = req.params.username
    try {
        const user = await User.findAll({
            attributes: ['username', 'email'],
            where: { username: username },
        })
        if (user.length === 0) {
            res.status(404).json({ code: 404, data: 'user not found' })
        } else {
            res.json({ code: 200, data: user })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

// GET user by email
app.get('/email/:email', async (req, res) => {
    const email = req.params.email
    try {
        const user = await User.findAll({
            attributes: ['username', 'email'],
            where: { email: email },
        })
        if (user.length === 0) {
            res.status(404).json({ code: 404, data: 'user not found' })
        } else {
            res.json({ code: 200, data: user })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

// GET all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['username', 'email'],
        })
        if (users.length === 0) {
            res.status(404).json({ code: 404, data: 'users not found' })
        } else {
            res.json({ code: 200, data: users })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})
/*
// GET blacklist to do


app.get('/blacklist', async (req,res)=>{
try { const users= await User.findAll({
    attributes: ['username','email', 'active'],
})
if (...)}

})
*/

// Start express server
app.listen(PORT, IP, () => {
    console.log(`listening on ${IP}:${PORT}`)
})
