import express from 'express'
import path from 'path'
import { ENV } from './lib/env.js'

const app = express()

const __dirname = path.resolve()

app.get('/health', (req,res) => {
    res.status(200).json({msg: "Success from health"})
})

app.get('/books', (req,res) => {
    res.status(200).json({msg: "Success from Books"})
})

// making ready for deployment
if(ENV.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../FrontEnd/dist")))

    app.get('/{*any}', (req,res) => {
        res.sendFile(path.join(__dirname, "../FrontEnd", "dist", "index.html"))
    })
}

app.listen(ENV.PORT, () => console.log("Server is running on port:", ENV.PORT))