import express, { json } from "express"
import dotenv from "dotenv"
import AppEspecialidad from "./routes/Cespecialidad.js";
import AppConsultorio from "./routes/Cconsultorio.js";
import AppMedico from "./routes/Cmedico.js";
import AppCita from "./routes/Ccita.js";
import AppEstadoCita from "./routes/Cestado_cita.js";
import AppUsuario from "./routes/Cusuario.js";
import AppAcudiente from "./routes/Cacudiente.js";
import AppGenero from "./routes/Cgenero.js";
import AppTipoDocumento from "./routes/tipoDocumento.js";

console.clear();
dotenv.config("../");

let ApiCitas = express();
ApiCitas.use(express.json());


//Rutas de validacion
// ════════ ⋆★⋆ ════════
ApiCitas.use('/Especialidad', AppEspecialidad);
ApiCitas.use('/Consultorio', AppConsultorio);
ApiCitas.use('/Medico', AppMedico);
ApiCitas.use('/Cita', AppCita);
ApiCitas.use('/EstadoCita', AppEstadoCita);
ApiCitas.use('/Usuario', AppUsuario);
ApiCitas.use('/Acudiente', AppAcudiente);
ApiCitas.use('/Genero', AppGenero);
ApiCitas.use('/TipoDocumento', AppTipoDocumento);
// ════════ ⋆★⋆ ════════

//Rutas de validacion
// ════════ ⋆★⋆ ════════
// ════════ ⋆★⋆ ════════

const config = JSON.parse(process.env.MY_CONFIG);
ApiCitas.listen(config, ()=>{console.log(`http://${config.hostname}:${config.port}`);})
