(function(){
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
  window.gtag('js',new Date());
  window.gtag('config','G-6F1YK4T3TE');
  document.addEventListener('click',function(event){
    var link=event.target.closest&&event.target.closest('a');
    if(!link)return;
    var href=link.getAttribute('href')||'';
    if(href.indexOf('/projetos/')===0||href.indexOf('#projetos')!==-1)window.gtag('event','view_project',{project_link:href});
    if(href.indexOf('mailto:')===0||href.indexOf('/contato/')===0)window.gtag('event','contact_click',{contact_target:href});
  });
})();
