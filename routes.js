
import express from 'express'
import sql from './src/database.js'
import jwt from 'jsonwebtoken'
import { expressjwt } from "express-jwt"
import { v4 as uuidv4 } from 'uuid'
import s3Client from './src/configAWS.js'
import {
    DeleteObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";

// AWSCompromisedKeyQuarantineV2 não deu para usar

// expressjwt({ secret: 'keys_hub', algorithms: ["HS256"]})

const router = express.Router()

router.get('/', async (req, res)=>{
        try{
        const data = await sql`select * from usuario`;
        return res.status(200).json(data)
    }
    catch{
        return res.status(404).json(`error`)
    }
})



router.post('/login', async (req, res)=>{
    try {
        const { email, senha } = req.body;
        if(email != null && email != "" && senha != null && senha != "")
        {
            const data = await sql`select id, nome from Usuario where email = ${email} and senha = ${senha}`;
            if(data.length == 0)
            {   
                return res.status(204).json('usuario ou senha incorreta')
            }
            //const token = jwt.sign({ email: email }, 'keys_hub', { algorithm: 'HS256' });
            console.log()
            return res.status(200).json({msg: 'ok'})
        }
            return res.status(400).json("bad request");

    } 
    catch (error){
        console.log(error)
        return res.status(500).json('Error on server!')
    }
})

router.get('/subareas', async(req, res) =>{

    try{

        const materia = await sql `select * from materia`
    
        return res.status(200).json(materia)
    }catch(error){
        console.log(error)
        return res.status(500).json('Error on server!')
    }
})

router.get('/areas', async(req, res) =>{

    try{

        const areas = await sql `select * from grande_area`
    
        return res.status(200).json(areas)
    }catch(error){
        console.log(error)
        return res.status(500).json('Error on server!')
    }
})

router.post('/questao/new', async(req, res)=>{
   

    // Defini o parametro do multpart/form-data como image apenas de exemplo
    // podem ser passado quais e quantos campos quiser
    try{
        const { image } = req.files
 
    const { enunciado,
        alternativa_a, 
        alternativa_b, 
        alternativa_c, 
        alternativa_d, 
        alternativa_e, 
        correta, 
        nivel,
        materia } = req.body

    let fileName = null
    
    if(image != null){

        fileName = `${uuidv4()}.jpeg`
        await s3Client.send(
            new PutObjectCommand({
                Bucket: 'quimicainbox',
                Key: fileName,
                Body: req.files.image.data,
            }),
        );
    }

    await sql`insert into questao(
                enunciado,
                imagem,
                alternativa_a,
                alternativa_b,
                alternativa_c,
                alternativa_d,
                alternativa_e, 
                correta, 
                nivel) 
              values(${enunciado}, 
                     ${`https://quimicainbox.s3.sa-east-1.amazonaws.com/${fileName}`}, 
                     ${alternativa_a}, 
                     ${alternativa_b}, 
                     ${alternativa_c}, 
                     ${alternativa_d}, 
                     ${alternativa_e}, 
                     ${correta},
                     ${nivel})`        

    const last_id = await sql`SELECT id FROM questao ORDER BY id DESC LIMIT 1`
    // last_id[0].id

    await sql`insert into questao_materia(id_questao, id_materia) values(${last_id[0].id}, ${materia})`

    return res.status(200).json('Sucess')
    }catch(error){

        return res.status(500).json(error)
    }

}) 

router.put('/questao/:fileName', async (req, res) =>{
   try {
    const { fileName } = req.params
    const { image } = req.files
    await s3Client.send(
        new PutObjectCommand({
            Bucket: 'quimicainbox',
            Key: `${fileName}.jpeg`,
            Body: image.data,
        }),
    );
    return res.status(200).json('sla')
    
   } catch (error) {
    return res.status(500).json(error)
   }
})

router.put('/questao/:id',  async (req, res) =>{
    // console.log(req.auth)
    // if (!req.auth.email) return res.status(401).json('Não autorizado');
        // res.status(200).json('autorizado!');

    try {

        const { enunciado,
                alternativa_a,
                alternativa_b,
                alternativa_c,
                alternativa_d,
                alternativa_e, 
                correta, 
                nivel } = req.body;
        const { id } = req.params;


        await sql`update questao set  = ${enunciado}, ${alternativa_a}, ${alternativa_b}, 
        ${alternativa_c}, ${alternativa_d}, ${alternativa_e}, ${correta}, ${nivel} where id = ${id}`
        return res.status(200).json('atualizado com sucesso!')
    } catch (error) {
        return res.status(500).json('error in update questão')
    }
})

router.delete("/questao/:id/:fileName", async(req, res)=>{
     try {

        const { id, fileName } = req.params;
    
        
        await sql`delete from questao where id = ${id}`
        await sql`delete from  questao_materia where id_questao = ${id}`

       if(fileName != 'null'){
        
            await s3Client.send(
            new DeleteObjectCommand({
                Bucket: 'quimicainbox',
                Key: `${fileName}.jpeg`            
            }),
        );
       }
        return res.status(200).json('ok')
    } catch (error) {
        return res.status(500).json('error to delete questao', console.log(error))
    }
})

router.get('/teste/:materia', async (req, res)=>{
    //console.log(req.auth)
    //if (!req.auth.email) return res.status(401).json('Não autorizado');
        //res.status(200).json('autorizado!');
    try{
        const{ materia } = req.params; // tem que vir o id

        const teste = await sql`select q.id, q.enunciado, q.imagem, q.alternativa_a, q.alternativa_b, q.alternativa_c, alternativa_d, 
alternativa_e, correta, nivel from materia as m inner join questao_materia as qm on qm.id_materia = m.id inner join questao as q 
on q.id = qm.id_questao where m.id = ${materia} ORDER BY RANDOM() LIMIT 20`
return res.status(200).json(teste)
    } 
    catch(error){
        console.log(error)
        return res.status(500).json('error ao encontrar')
    }
})

router.delete("/testzin/:fileName", async (req, res) => {
    try {

        const { fileName } = req.params

        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: 'quimicainbox',
                Key: `${fileName}.jpeg`,
            }),
        );
        return res.status(200).json('ok')
    } 
    catch (error) {
        console.log(error)
        return res.status(500).json('error ao encontrar')
    }
}) 
 
// router.post('/upload', upload.single('file'), async (req, res) => {
//     try {
//         const { originalname: name, location: url = '', key } = req.file;
//         const image = await Image.create({ name, url, key });
//         return res.json(image);
//       } catch (err) {
//         return res.status(500).json({ error: 'Erro ao fazer upload de imagem' });
//       }
//     });
  
  // Rota DELETE para remover uma imagem
//   router.delete('/upload/:id', async (req, res) => {
//     try {
//       const image = await Image.findById(req.params.id);
//       if (!image) {
//         return res.status(404).json({ error: 'Imagem não encontrada' });
//       }
  
//       // Código para deletar a imagem do S3 usando o nome ou URL
//       await image.remove();
//       return res.send();
//     } catch (err) {
//       return res.status(500).json({ error: 'Erro ao deletar imagem' });
//     }
//   });

export default router
