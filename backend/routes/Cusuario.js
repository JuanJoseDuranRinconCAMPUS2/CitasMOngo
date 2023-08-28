import { Router } from "express";
import {limitGColecciones, limitPColecciones, limitDColecciones} from '../middleware/limit.js';
import errorcontroller from "../middleware/erroresMongo.js";
import { con } from '../db/atlas.js';

const AppUsuario = Router();
let db = await con();
let usuario = db.collection("usuario");
let autoincrement = db.collection("autoincrement");
async function  increment(coleccion){
    const sequenceDocument = await autoincrement.findOneAndUpdate(
        { _id: `${coleccion}Id` },
        { $inc: { sequence_value: 1 } },
        { returnDocument: "after" }
    );
    return sequenceDocument.value.sequence_value;
}
AppUsuario.get('/GetUsuario', limitGColecciones(), async (req, res) =>{
    if(!req.rateLimit) return;
    let result = await usuario.find({}).sort( { _id: 1 } ).toArray();
    res.send(result)

})

AppUsuario.post('/PostUsuario', limitPColecciones(420, "Usuario"), async (req, res) =>{
    if(!req.rateLimit) return;
    const id =  await increment("usuario");
    let data = {_id: id, ...req.body}
    try { 
        let result = await usuario.insertOne(data)
        res.status(200).send({status: 200, message: `Documento con el id ${id} se ha creado Correctamente`});
      } catch (error) {
        errorcontroller(error, res);
      }
})

AppUsuario.put('/PutUsuario', limitPColecciones(420, "Usuario"), async (req, res) =>{
    if(!req.rateLimit) return;
    const id = parseInt(req.query.id, 10);
    let data = {...req.body}
    try {
        
        let result = await usuario.updateOne({ _id: id }, { $set: data })
        if (result.modifiedCount > 0) {
            res.status(200).send({status: 200, message: `Documento con el id ${id} se ha actualizado Correctamente`});
        } else {
            result.matchedCount === 1
            ? res.status(200).send({ status: 200, message:`No se realizaron cambios en el documento con el id ${id}`})
            : res.status(404).send({ status: 404, message:`El documento con el id ${id} no ha sido encontrado`});
        }
      } catch (error) {
        errorcontroller(error, res);
      }
})

AppUsuario.delete('/DeleteUsuario', limitDColecciones(), async (req, res) =>{
    if(!req.rateLimit) return;
    const id = parseInt(req.body.id, 10);
    try {
        let result = await usuario.deleteOne({ _id: id })
        result.deletedCount === 1
        ? res.status(200).send({ status: 200, message:`Documento con el id ${id} ha sido eliminado correctamente`})
        : res.status(404).send({ status: 404, message:`El documento con el id ${id} no ha sido encontrado`});
      } catch (error) {
        errorcontroller(error, res);
      }
})

//🪓🦊 Rutas Especiales

//1 
// Obtener todos los pacientes alfabéticamente

AppUsuario.get('/UsuarioOrdenAZ', limitGColecciones(), async (req, res) =>{
  if(!req.rateLimit) return;
  let result = await usuario.find({}).sort( { usu_nombre: 1, usu_primer_apellido_usuar: 1 } ).toArray();
  res.send(result)

})

// 5
// Encontrar todos los pacientes que tienen citas con un médico específico (por ejemplo, el médico con **med_nroMatriculaProsional 1**)
AppUsuario.get('/PacientesXMedico', limitPColecciones(40, "Usuario"), async (req, res) =>{
  if(!req.rateLimit) return;
  let cita = db.collection("cita");
  let medico = db.collection("medico");
  try {
    let result = await medico.findOne({ _id: req.body.medico_id });
    if (!result) {
      return res.status(404).send({ status: 404, message:`La medico con el id ${req.body.medico_id} no ha sido encontrado`});
    }
    let result2 = await cita.aggregate([  
        {    
            $lookup: {      
                from: "usuario",     
                localField: "cit_datosUsuario",      
                foreignField: "_id",      
                as: "usuarios"   
             }  
        },  
        {    
            $lookup: {      
                from: "medico",     
                localField: "cit_medico",      
                foreignField: "_id",      
                as: "medicos"   
             }  
        },  
        {
            $match: {
                usuarios: { $ne: [] }, 
                medicos: { $ne: [] },
                cit_medico: { $eq: result._id }
            }
        },
        {
            $unwind: "$usuarios"
        },
        {
            $unwind: "$medicos"
        },
        {
            $set: { 
                nombreUsuario: {
                    $cond: {
                        if: { $eq: ["$usuarios.usu_segdo_nombre", null] },
                        then: "$usuarios.usu_nombre",
                        else: {
                          $concat: ["$usuarios.usu_nombre", " ", "$usuarios.usu_segdo_nombre"]
                        }
                    }
                },
                Medico: {
                    $concat: ["El paciente tiene citas con el medico:", " ", "$medicos.med_nombreCompleto"]
                }
            }
        },
        {
            $group: {
                _id: "$usuarios._id",
                nombreUsuario: {
                    $first: "$nombreUsuario"
                },
                usu_primer_apellido_usuar: {
                    $first: "$usuarios.usu_primer_apellido_usuar"
                },
                Medico: {
                    $first: "$Medico"
                }
            }
        }
    ]).sort( { _id: 1 } ).toArray();
    res.send(result2)
  } catch (error) {
    errorcontroller(error)
  }
})

//6
// Obtener las consultorías para un paciente específico (por ejemplo, paciente **con usu_id 1**)

AppUsuario.get('/ConsultoriasXPaciente', limitPColecciones(40, "Usuario"), async (req, res) =>{
  if(!req.rateLimit) return;
  let cita = db.collection("cita");
  console.log(req.body.Id);
  let result = await cita.find({ cit_datosUsuario: req.body.Id}).sort( { _id : 1}).toArray();
  if (result.length == 0) {
    return res.status(404).send({ status: 404, message:`La paciente con el id ${req.body.Id} no ha sido encontrado`});
  }
  res.send(result)

})

export default AppUsuario;