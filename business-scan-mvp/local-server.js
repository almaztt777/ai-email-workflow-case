const http=require('http'),fs=require('fs'),path=require('path');
const scan=require('./api/scan');
http.createServer(async(req,res)=>{
 if(req.url==='/api/scan'&&req.method==='POST'){let b='';req.on('data',c=>b+=c);req.on('end',async()=>{req.body=b;res.status=n=>{res.statusCode=n;return res};res.json=o=>{res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(o))};await scan(req,res)});return}
 if(req.url==='/'||req.url==='/index.html'){res.setHeader('content-type','text/html; charset=utf-8');return res.end(fs.readFileSync(path.join(__dirname,'index.html')))}
 res.statusCode=404;res.end('Not found');
}).listen(process.env.PORT||3000,()=>console.log('AI Business Scan: http://localhost:'+(process.env.PORT||3000)));