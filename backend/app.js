import express, { json } from "express"
import dotenv from "dotenv"
import AppEspecialidad from "./routes/Cespecialidad.js";
import AppConsultorio from "./routes/Cconsultorio.js";
console.clear();
dotenv.config("../");

let ApiCitas = express();
ApiCitas.use(express.json());


//Rutas de validacion
// ════════ ⋆★⋆ ════════
ApiCitas.use('/Especialidad', AppEspecialidad);
ApiCitas.use('/Consultorio', AppConsultorio);

// ════════ ⋆★⋆ ════════

//Rutas de validacion
// ════════ ⋆★⋆ ════════
// ════════ ⋆★⋆ ════════

const config = JSON.parse(process.env.MY_CONFIG);
ApiCitas.listen(config, ()=>{console.log(`http://${config.hostname}:${config.port}`);})
