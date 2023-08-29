import { Router } from "express";
import {limitGColecciones, limitPColecciones, limitDColecciones} from '../middleware/limit.js';
import errorcontroller from "../middleware/erroresMongo.js";
import { con } from '../db/atlas.js';

const AppCita = Router();
let db = await con();
let cita = db.collection("cita");
let autoincrement = db.collection("autoincrement");
async function  increment(coleccion){
    const sequenceDocument = await autoincrement.findOneAndUpdate(
        { _id: `${coleccion}Id` },
        { $inc: { sequence_value: 1 } },
        { returnDocument: "after" }
    );
    return sequenceDocument.value.sequence_value;
}
AppCita.get('/GetCita', limitGColecciones(), async (req, res) =>{
    if(!req.rateLimit) return;
    let result = await cita.find({}).sort( { _id: 1 } ).toArray();
    res.send(result)

})

AppCita.post('/PostCita', limitPColecciones(180, "Medico"), async (req, res) =>{
    if(!req.rateLimit) return;
    const id =  await increment("cita");
    let data = {_id: id, ...req.body, cit_fecha: new Date(req.body.cit_fecha)}
    try { 
        let result = await cita.insertOne(data)
        res.status(200).send({status: 200, message: `Documento con el id ${id} se ha creado Correctamente`});
      } catch (error) {
        errorcontroller(error, res);
      }
})

AppCita.put('/PutCita', limitPColecciones(180, "Medico"), async (req, res) =>{
    if(!req.rateLimit) return;
    const id = parseInt(req.query.id, 10);
    let data = {...req.body, cit_fecha: new Date(req.body.cit_fecha)}
    try {
        
        let result = await cita.updateOne({ _id: id }, { $set: data })
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

AppCita.delete('/DeleteCita', limitDColecciones(), async (req, res) =>{
    if(!req.rateLimit) return;
    const id = parseInt(req.body.id, 10);
    try {
        let result = await cita.deleteOne({ _id: id })
        result.deletedCount === 1
        ? res.status(200).send({ status: 200, message:`Documento con el id ${id} ha sido eliminado correctamente`})
        : res.status(404).send({ status: 404, message:`El documento con el id ${id} no ha sido encontrado`});
      } catch (error) {
        errorcontroller(error, res);
      }
})

//🪓🦊 Rutas Especiales

// 2 
// Obtener todas las citas por fechas
AppCita.get('/CitasOrdenFecha', limitGColecciones(), async (req, res) =>{
  if(!req.rateLimit) return;
  let result = await cita.find({}).sort( { cit_fecha: 1 } ).toArray();
  res.send(result)

})

// 4
// Encontrar la próxima cita para un paciente específico (por ejemplo, el paciente con **usu_id 1**)
AppCita.get('/CitasXUsuario', limitPColecciones(80, "Citas"), async (req, res) =>{
  if(!req.rateLimit) return;
  let usuario = db.collection("usuario");
  try {
    let result = await usuario.findOne({ _id: req.body.usu_id });
    if (!result) {
      return res.status(404).send({ status: 404, message:`La usuario con el id ${req.body.usu_id} no ha sido encontrado`});
    }
    let result2 = await usuario.aggregate([  
      {    
          $lookup: {      
              from: "cita",     
              localField: "_id",      
              foreignField: "cit_datosUsuario",      
              as: "citas"   
          }  
      },  
      {
          $match: {citas: { $ne: []}, _id: { $eq: result._id }}
      },
      {
          $unwind: "$citas"
      },
      {
          $set: { 
              citas: "$citas.cit_fecha", 
              nombreUsuario: {
                  $cond: {
                      if: { $eq: ["$usu_segdo_nombre", null] },
                      then: "$usu_nombre",
                      else: {
                        $concat: ["$usu_nombre", " ", "$usu_segdo_nombre"]
                      }
                  }
              } 
          }
      },
      {
          $group: {
              _id: "$_id",
              nombreUsuario: {
                  $first: "$nombreUsuario"
              },
              usu_primer_apellido_usuar: {
                  $first: "$usu_primer_apellido_usuar"
              },
              citas: {
                  $first: "$citas"
              }
          }
      }
    ]).sort( { _id: 1, citas: 1 } ).toArray();
    res.send(result2)
  } catch (error) {
    errorcontroller(error)
  }
})

//7
// Encontrar todas las citas para un día específico (por ejemplo, **'2023-07-12'**)

AppCita.get('/CitasXFecha', limitPColecciones(40, "Citas"), async (req, res) =>{
  if(!req.rateLimit) return;
  let cita = db.collection("cita");
  let result = await cita.find({ cit_fecha: new Date(req.body.fecha_Cita)}).sort( { _id : 1}).toArray();
  if (result.length == 0) {
    return res.status(404).send({ status: 404, message:`La cita con la fecha ${req.body.fecha_Cita} no ha sido encontrado`});
  }
  res.send(result)

})
export default AppCita;