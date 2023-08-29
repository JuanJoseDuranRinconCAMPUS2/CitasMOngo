import { Router } from "express";
import {limitGColecciones, limitPColecciones, limitDColecciones} from '../middleware/limit.js';
import errorcontroller from "../middleware/erroresMongo.js";
import { con } from '../db/atlas.js';

const AppMedico = Router();
let db = await con();
let medico = db.collection("medico");
let autoincrement = db.collection("autoincrement");
async function  increment(coleccion){
    const sequenceDocument = await autoincrement.findOneAndUpdate(
        { _id: `${coleccion}Id` },
        { $inc: { sequence_value: 1 } },
        { returnDocument: "after" }
    );
    return sequenceDocument.value.sequence_value;
}
AppMedico.get('/GetMedico', limitGColecciones(), async (req, res) =>{
    if(!req.rateLimit) return;
    let result = await medico.find({}).sort( { _id: 1 } ).toArray();
    res.send(result)

})

AppMedico.post('/PostMedico', limitPColecciones(180, "Medico"), async (req, res) =>{
    if(!req.rateLimit) return;
    const id =  await increment("medico");
    let data = {_id: id, ...req.body}
    try { 
        let result = await medico.insertOne(data)
        res.status(200).send({status: 200, message: `Documento con el id ${id} se ha creado Correctamente`});
      } catch (error) {
        errorcontroller(error, res);
      }
})

AppMedico.put('/PutMedico', limitPColecciones(180, "Medico"), async (req, res) =>{
    if(!req.rateLimit) return;
    const id = parseInt(req.query.id, 10);
    let data = {...req.body}
    try {
        
        let result = await medico.updateOne({ _id: id }, { $set: data })
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

AppMedico.delete('/DeleteMedico', limitDColecciones(), async (req, res) =>{
    if(!req.rateLimit) return;
    const id = parseInt(req.body.id, 10);
    try {
        let result = await medico.deleteOne({ _id: id })
        result.deletedCount === 1
        ? res.status(200).send({ status: 200, message:`Documento con el id ${id} ha sido eliminado correctamente`})
        : res.status(404).send({ status: 404, message:`El documento con el id ${id} no ha sido encontrado`});
      } catch (error) {
        errorcontroller(error, res);
      }
})

//🪓🦊 Rutas Especiales

// 3
// Obtener todos los médicos de una especialidad específica (por ejemplo, **'Cardiología'**):
AppMedico.get('/MedicosXEspecialidad', limitPColecciones(80, "Medico"), async (req, res) =>{
  if(!req.rateLimit) return;
  let especialidad = db.collection("especialidad");
  let result = await especialidad.findOne({ esp_nombre: req.body.especialidad });
  if (!result) {
    return res.status(404).send({ status: 404, message:`La especialidad con el nombre ${req.body.especialidad} no ha sido encontrado`});
  }
  let result2 = await medico.aggregate([  
    {    
        $lookup: {      
            from: "especialidad",     
            localField: "med_especialidad",      
            foreignField: "_id",      
            as: "especialidad"   
         }  
    },  
    {
        $match: {medicos: { $ne: [] }, med_especialidad: { $eq: result._id }}
    },
    {
        $unwind: "$especialidad"
    },
    {
        $set: { especialidad: "$especialidad.esp_nombre" }
    },
    {
        $group: {
            _id: "$_id",
            med_nombreCompleto: {
                $first: "$med_nombreCompleto"
            },
            med_especialidad: {
                $first: "$med_especialidad"
            },
            especialidad: {
                $first: "$especialidad"
            }
        }
    }
]).toArray();
  res.send(result2)

})

// 8
// Obtener los médicos y sus consultorios
AppMedico.get('/MedicosYConsultorios', limitGColecciones(), async (req, res) =>{
    if(!req.rateLimit) return;
    let result = await medico.aggregate([  
        {    
            $lookup: {      
                from: "consultorio",     
                localField: "med_consultorio",      
                foreignField: "_id",      
                as: "consultorios"   
             }  
        },  
        {
            $match: {consultorios: { $ne: [] }}
        },
        {
            $unwind: "$consultorios"
        },
        {
            $set: { consultorio: "$consultorios.cons_nombre" }
        },
        {
            $group: {
                _id: "$_id",
                med_nombreCompleto: {
                    $first: "$med_nombreCompleto"
                },
                consultorio: {
                    $first: "$consultorio"
                }
            }
        }
    ]).sort( { _id: 1 } ).toArray();
    res.send(result)

})

// 9
// Contar el número de citas que un médico tiene en un día específico (por ejemplo, el médico con **med_nroMatriculaProsional 1 en '2023-07-12'**)
AppMedico.get('/MedicosXNumCitasFechas', limitPColecciones(80, "Medico"), async (req, res) =>{
    if(!req.rateLimit) return;
    let cita = db.collection("cita");
    let result = await medico.findOne({ _id: req.body.Id});
    if (!result) {
      return res.status(404).send({ status: 404, message:`El medico con el id ${req.body.Id} no ha sido encontrado`});
    }
    let result2 = await cita.findOne({ cit_medico: req.body.Id , cit_fecha: new Date(req.body.Fecha)});
    if (!result2) {
      return res.status(404).send({ status: 404, message:`El medico ${req.body.Id} no tiene ninguna fecha registrada a esta hora ${req.body.Fecha}`});
    }
    let result3 = await medico.aggregate([  
        {    
            $lookup: {      
                from: "cita",     
                localField: "_id",      
                foreignField: "cit_medico",      
                as: "citas"   
             }  
        },  
        {
            $match: {citas: { $ne: [] }, _id : {$eq : req.body.Id} , "citas.cit_fecha" : {$eq : new Date(req.body.Fecha)}}
        },
        {
            $unwind: "$citas"
        },
        {
            $set: { citas: "$citas" }
        },
        {
            $group: {
                _id: "$_id",
                med_nombreCompleto: {
                    $first: "$med_nombreCompleto"
                },
                fechaCitas: {
                    $first: "$citas.cit_fecha"
                },
                totalCitas: {
                    $sum: 1
                }
            }
        }
    ]).toArray();
    res.send(result3);
  })
export default AppMedico;