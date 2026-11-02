const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const providers = {
  btc: {pattern:/^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/, endpoint:a=>`https://blockstream.info/api/address/${encodeURIComponent(a)}`},
  eth: {pattern:/^0x[a-fA-F0-9]{40}$/, endpoint:a=>`https://eth.blockscout.com/api/v2/addresses/${encodeURIComponent(a)}`}
};
const respond=(res,status,body,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; script-src 'self' 'unsafe-inline';'; base-uri 'none'; form-action 'none'",'Cache-Control':'no-store'});res.end(typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body));};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(req.method!=='GET')return respond(res,405,{error:'Method not allowed'});
  if(url.pathname==='/health')return respond(res,200,{status:'ok'});
  if(url.pathname==='/api/inspect'){
   const chain=(url.searchParams.get('chain')||'').trim().toLowerCase();
   const address=(url.searchParams.get('address')||'').trim();
   const p=providers[chain];
   if(!p||!p.pattern.test(address))return respond(res,400,{error:'Invalid blockchain network or public address'});
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
   let response;
   try{response=await fetch(p.endpoint(address),{signal:controller.signal,headers:{Accept:'application/json'}})}finally{clearTimeout(timeout)}
   if(response.status===404)return respond(res,404,{error:'Public explorer does not recognize this address'});
   if(!response.ok)return respond(res,502,{error:'Public blockchain data provider unavailable'});
   const d=await response.json();
   if(chain==='btc'){
    const incoming=(d.chain_stats?.funded_txo_sum||0)+(d.mempool_stats?.funded_txo_sum||0);
    const outgoing=(d.chain_stats?.spent_txo_sum||0)+(d.mempool_stats?.spent_txo_sum||0);
    return respond(res,200,{chain,address,balance:(incoming-outgoing)/1e8,unit:'BTC',transactions:(d.chain_stats?.tx_count||0)+(d.mempool_stats?.tx_count||0),note:'Includes unconfirmed transactions',explorer:`https://blockstream.info/address/${encodeURIComponent(address)}`});
   }
   return respond(res,200,{chain,address,balance:Number(d.coin_balance||0)/1e18,unit:'ETH',transactions:d.transactions_count??'See explorer',note:'Native ETH only; tokens not included',explorer:`https://eth.blockscout.com/address/${encodeURIComponent(address)}`});
  }
  if(url.pathname==='/')return respond(res,200,await fs.readFile(path.join(__dirname,'public','index.html')),'text/html; charset=utf-8');
  return respond(res,404,{error:'Not found'});
 }catch(error){console.error(error);return respond(res,500,{error:'Unable to complete inspection'});}
}).listen(Number(process.env.PORT)||10000,'0.0.0.0');
