import { Router } from "express";
import {limitGColecciones, limitPColecciones, limitDColecciones} from '../middleware/limit.js';
import errorcontroller from "../middleware/erroresMongo.js";
import { con } from '../db/atlas.js';

const AppTipoDocumento = Router();
let db = await con();
let tipo_documento = db.collection("tipo_documento");
let autoincrement = db.collection("autoincrement");
async function  increment(coleccion){
    const sequenceDocument = await autoincrement.findOneAndUpdate(
        { _id: `${coleccion}Id` },
        { $inc: { sequence_value: 1 } },
        { returnDocument: "after" }
    );
    return sequenceDocument.value.sequence_value;
}
AppTipoDocumento.get('/GetTipoDocumento', limitGColecciones(), async (req, res) =>{
    if(!req.rateLimit) return;
    let result = await tipo_documento.find({}).sort( { _id: 1 } ).toArray();
    res.send(result)

})

AppTipoDocumento.post('/PostTipoDocumento', limitPColecciones(100, "TipoDocumento"), async (req, res) =>{
    if(!req.rateLimit) return;
    const id =  await increment("tipo_documento");
    let data = {_id: id, ...req.body}
    try { 
        let result = await tipo_documento.insertOne(data)
        res.status(200).send({status: 200, message: `Documento con el id ${id} se ha creado Correctamente`});
      } catch (error) {
        errorcontroller(error, res);
      }
})

AppTipoDocumento.put('/PutTipoDocumento', limitPColecciones(100, "TipoDocumento"), async (req, res) =>{
    if(!req.rateLimit) return;
    const id = parseInt(req.query.id, 10);
    let data = {...req.body}
    try {
        
        let result = await tipo_documento.updateOne({ _id: id }, { $set: data })
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

AppTipoDocumento.delete('/DeleteTipoDocumento', limitDColecciones(), async (req, res) =>{
    if(!req.rateLimit) return;
    const id = parseInt(req.body.id, 10);
    try {
        let result = await tipo_documento.deleteOne({ _id: id })
        result.deletedCount === 1
        ? res.status(200).send({ status: 200, message:`Documento con el id ${id} ha sido eliminado correctamente`})
        : res.status(404).send({ status: 404, message:`El documento con el id ${id} no ha sido encontrado`});
      } catch (error) {
        errorcontroller(error, res);
      }
})

export default AppTipoDocumento;