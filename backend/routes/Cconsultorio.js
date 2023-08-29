import { Router } from "express";
import {limitGColecciones, limitPColecciones, limitDColecciones} from '../middleware/limit.js';
import errorcontroller from "../middleware/erroresMongo.js";
import { con } from '../db/atlas.js';

const AppConsultorio = Router();
let db = await con();
let consultorio = db.collection("consultorio");
let autoincrement = db.collection("autoincrement");
async function  increment(coleccion){
    const sequenceDocument = await autoincrement.findOneAndUpdate(
        { _id: `${coleccion}Id` },
        { $inc: { sequence_value: 1 } },
        { returnDocument: "after" }
    );
    return sequenceDocument.value.sequence_value;
}
AppConsultorio.get('/GetConsultorio', limitGColecciones(), async (req, res) =>{
    if(!req.rateLimit) return;
    let result = await consultorio.find({}).sort( { _id: 1 } ).toArray();
    res.send(result)

})

AppConsultorio.post('/PostConsultorio', limitPColecciones(82, "Consultorio"), async (req, res) =>{
    if(!req.rateLimit) return;
    const id =  await increment("consultorio");
    let data = {_id: id, ...req.body}
    try { 
        let result = await consultorio.insertOne(data)
        res.status(200).send({status: 200, message: `Documento con el id ${id} se ha creado Correctamente`});
      } catch (error) {
        errorcontroller(error, res);
      }
})

AppConsultorio.put('/PutConsultorio', limitPColecciones(82, "Consultorio"), async (req, res) =>{
    if(!req.rateLimit) return;
    const id = parseInt(req.query.id, 10);
    let data = {...req.body}
    try {
        
        let result = await consultorio.updateOne({ _id: id }, { $set: data })
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

AppConsultorio.delete('/DeleteConsultorio', limitDColecciones(), async (req, res) =>{
    if(!req.rateLimit) return;
    const id = parseInt(req.body.id, 10);
    try {
        let result = await consultorio.deleteOne({ _id: id })
        result.deletedCount === 1
        ? res.status(200).send({ status: 200, message:`Documento con el id ${id} ha sido eliminado correctamente`})
        : res.status(404).send({ status: 404, message:`El documento con el id ${id} no ha sido encontrado`});
      } catch (error) {
        errorcontroller(error, res);
      }
})

//🪓🦊 Rutas Especiales

//10
//Obtener los consultorio donde se aplicó las citas de un paciente (por ejemplo, el paciente con **usu_id 1**)
AppConsultorio.get('/ConsultorioXPaciente', limitPColecciones(80, "Consultorios"), async (req, res) =>{
  if(!req.rateLimit) return;
  let usuario = db.collection("usuario");
  let medico = db.collection("medico");
  try {
    let result = await usuario.findOne({ _id: req.body.usu_id });
    if (!result) {
      return res.status(404).send({ status: 404, message:`El paciente con el id ${req.body.usu_id} no ha sido encontrado`});
    }
    let result2 = await medico.aggregate([  
      {    
          $lookup: {      
              from: "cita",     
              localField: "_id",      
              foreignField: "cit_medico",      
              as: "citas"   
           }  
      },  
      {    
          $lookup: {      
              from: "consultorio",     
              localField: "_id",      
              foreignField: "_id",      
              as: "consultorios"   
           }  
      },  
      {
          $match: {citas: { $ne: [] } , "citas.cit_datosUsuario" : {$eq : req.body.usu_id}}
      },
      {
          $unwind: "$citas"
      },
      {
          $unwind: "$consultorios"
      },
      {
          $set: { Consultorios: "$consultorios.cons_nombre" }
      },
      {
          $group: {
              _id: "$citas._id",
              paciente_Id: {
                  $first: "$citas.cit_datosUsuario"
              },
              med_nombreCompleto: {
                  $first: "$med_nombreCompleto"
              },
              Consultorios: {
                  $first: "$Consultorios"
              }
          }
      }
  ]).sort( { _id: 1, citas: 1 } ).toArray();
    res.send(result2)
  } catch (error) {
    errorcontroller(error)
  }
})
export default AppConsultorio;