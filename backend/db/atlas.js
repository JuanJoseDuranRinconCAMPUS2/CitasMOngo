import { MongoClient } from 'mongodb';
import dotenv from "dotenv"
console.clear
dotenv.config("../");
let mongo = process.env
let con = undefined
export async function con(uri) {

    let URI= `mongodb+srv://${mongo.mongoUsuario}:${mongo.mongoPassword}@<clustername>.mongodb.net/${mongo.mongoBD}`
    try {
        db = new MongoClient(uri);
        console.log('Conectando.....');
        await db.connect();
        console.log('Coneccion completa');
 
        return db;
    } catch (error) {
        console.error('Error al conectar', error);
        process.exit();
    }
 }