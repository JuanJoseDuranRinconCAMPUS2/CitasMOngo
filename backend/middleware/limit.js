import rateLimit from "express-rate-limit";

export let limitGColecciones = () => {
    return rateLimit({
        windowMs: 15 * 1000, // 15 sg
        max: 5, 
        standardHeaders: true, 
        legacyHeaders: false, 
        skip: (req, res) =>{
            if(req.headers["content-length"]>1){
                res.status(413).send({
                    status: 413,
                    message: "Este EndPoint no admite datos de entrada"
                });
                return true;
            }
        },
        message: (req,res)=>{
            res.status(429).send({
                status: 429,
                message: 'Demasiadas consultas en un corto periodo de tiempo en el endpoint Colecciones'
            })
        }
    })
}

export let limitPColecciones = (num, name) => {
    return rateLimit({
        windowMs: 30 * 1000, // 30 sg
        max: 5, 
        standardHeaders: true, 
        legacyHeaders: false, 
        skip: (req, res) =>{
            if(req.headers["content-length"]>num){
                res.status(413).send({
                    status: 413,
                    message: "El tamaño de data es incorrecto"
                });
                return true;
            }
        },
        message: (req,res)=>{
            res.status(429).send({
                status: 429,
                message: `Demasiadas consultas en un corto periodo de tiempo en el endpoint ${name} (espere 30 sg y vuelva a intentarlo)`
            })
        }
    })
}

export let limitDColecciones = () => {
    return rateLimit({
        windowMs: 30 * 1000, // 30 sg
        max: 5, 
        standardHeaders: true, 
        legacyHeaders: false, 
        skip: (req, res) =>{
            if(req.headers["content-length"]>20){
                res.status(413).send({
                    status: 413,
                    message: "El tamaño de data es incorrecto"
                });
                return true;
            }
        },
        message: (req,res)=>{
            res.status(429).send({
                status: 429,
                message: 'Demasiadas consultas en un corto periodo de tiempo en el endpoint (espere 30 sg y vuelva a intentarlo)'
            })
        }
    })
}