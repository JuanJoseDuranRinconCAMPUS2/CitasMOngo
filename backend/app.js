import express, { json } from "express"
import dotenv from "dotenv"
console.clear();
dotenv.config("../");
let ApiCitas = express();
let config = process.env.config
dotenv.parse(config)

console.log(config);

ApiCitas.listen(config, ()=>{
    console.log(`http://127.0.0.1:${config.port}/`);
})
