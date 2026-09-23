// Envia o formulário de contato para a Edge Function do Supabase (data-endpoint).
// Sem endpoint configurado, ou se o envio falhar, cai no e-mail (mailto) como antes.
document.addEventListener('DOMContentLoaded',function(){
  var form=document.querySelector('.contact-form');
  if(!form)return;
  var endpoint=form.getAttribute('data-endpoint');
  var button=form.querySelector('button[type="submit"]');
  var status=form.querySelector('.form-status');
  var buttonHTML=button.innerHTML;

  function setStatus(text,type){status.textContent=text;status.className='form-status'+(type?' is-'+type:'')}
  function mailtoFallback(data){
    var body='Nome: '+data.name+'\nE-mail: '+data.email+'\n\n'+data.message;
    location.href='mailto:oi@37lab.com.br?subject='+encodeURIComponent('Projeto com a 37LAB — '+data.name)+'&body='+encodeURIComponent(body);
  }

  form.addEventListener('submit',function(event){
    event.preventDefault();
    var data={
      name:form.elements.nome.value.trim(),
      email:form.elements.email.value.trim(),
      message:form.elements.mensagem.value.trim(),
      website:form.elements.website.value,
      page:location.pathname
    };
    if(!endpoint){mailtoFallback(data);return}

    button.disabled=true;button.textContent='Enviando…';setStatus('');
    fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
      .then(function(res){return res.json().catch(function(){return {}}).then(function(json){return {res:res,json:json}})})
      .then(function(r){
        if(r.res.ok){
          form.reset();
          setStatus('Mensagem enviada! Respondemos em breve no seu e-mail.','ok');
          window.gtag&&gtag('event','generate_lead',{form:'contato'});
        }else if(r.json.error==='invalid_email'){
          setStatus('Confira o seu e-mail e tente de novo.','error');
        }else if(r.json.error==='rate_limited'){
          setStatus('Recebemos várias mensagens daqui. Tente mais tarde ou escreva para oi@37lab.com.br.','error');
        }else{throw new Error(r.json.error||r.res.status)}
      })
      .catch(function(){
        setStatus('Não conseguimos enviar agora. Abrindo seu e-mail para você mandar direto…','error');
        setTimeout(function(){mailtoFallback(data)},1200);
      })
      .finally(function(){button.disabled=false;button.innerHTML=buttonHTML});
  });
});
