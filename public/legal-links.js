document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('footer').forEach(function(footer){
    if(footer.querySelector('.legal-links'))return;
    var target=footer.querySelector('.copyright')||footer;
    var nav=document.createElement('nav');
    nav.className='legal-links';
    nav.setAttribute('aria-label','Links legais');
    nav.innerHTML='<a href="/privacidade/">Privacidade</a><a href="/termos/">Termos de uso</a>';
    target.appendChild(nav);
  });
});
