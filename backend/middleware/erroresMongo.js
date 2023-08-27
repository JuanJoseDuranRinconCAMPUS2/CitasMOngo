//Funcion de manejo de errores de mongo

function errorcontroller(error, res) {
    switch (error.code) {
        case 121:
            const ErrorL = error.errInfo.details.schemaRulesNotSatisfied;
            res.status(500).send({status: 500, message: ErrorText(ErrorL)});
        break;
        
        case 11000:
            res.status(500).send({status: 500, message:`Error al guardar la data, _id ya se encuentra en uso`});        
        break;
        default:
            res.status(500).send({ status: 500, message: "Error al guardar la data" });
        break;
    }
}



//Funcion de imprenta de mensajes de error de MONGO
function ErrorText(error) {
    let text = "Errores encontrados: "
    error.forEach(errores => {
         let TpoError = errores.operatorName;
        switch (TpoError) {
            case "properties":
                text += ` Error validacion incorrecta: `
                let DesError = errores.propertiesNotSatisfied
                DesError.forEach(Errores => {

                    text += `/${Errores.description}/ `
                });
                break;

            case "additionalProperties":
                let NoError = errores.additionalProperties
                text += ` Error data incorrecta: El programa no acepta la data catalogada como: `
                NoError.forEach(dataIn => {

                    text += `/${dataIn}/ `
                });
                console.log(errores);
                break;
        
            default:
                break;
        }
    });
    return text;
}

export default errorcontroller;