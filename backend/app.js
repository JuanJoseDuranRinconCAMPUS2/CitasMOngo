import express, { json } from "express"
import dotenv from "dotenv"

console.clear();
dotenv.config("../");

let ApiCitas = express();
ApiCitas.use(express.json());

// ════════ ⋆★⋆ ════════
// ════════ ⋆★⋆ ════════

//Rutas de validacion
// ════════ ⋆★⋆ ════════
// ════════ ⋆★⋆ ════════

const config = JSON.parse(process.env.MY_CONFIG);
ApiCitas.listen(config, ()=>{console.log(`http://${config.hostname}:${config.port}`);})
