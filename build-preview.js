/**
 * Builds preview.html from the REAL theme assets.
 *
 * The CSS and JS are read straight out of the theme (critical.css plus every
 * {% stylesheet %} block in sections/), so the preview cannot silently drift
 * away from what Shopify will actually render. Only the markup is transcribed
 * by hand, mirroring the Liquid output with the demo content from
 * templates/index.json.
 */
const fs = require('fs');
const path = require('path');

const THEME = path.join(__dirname, 'especell');

function read(rel) {
  return fs.readFileSync(path.join(THEME, rel), 'utf8');
}

/** Inline an SVG asset the same way Liquid's inline_asset_content does. */
function icon(name) {
  return read(path.join('assets', name)).trim();
}

/** Pull the {% stylesheet %} body out of a section file. */
function sectionCss(file) {
  const src = read(path.join('sections', file));
  const match = src.match(/\{%\s*stylesheet\s*%\}([\s\S]*?)\{%\s*endstylesheet\s*%\}/);
  return match ? match[1] : '';
}

const SECTION_FILES = [
  'header.liquid',
  'hero.liquid',
  'brands.liquid',
  'services.liquid',
  'how-it-works.liquid',
  'about.liquid',
  'stores.liquid',
  'testimonials.liquid',
  'faq.liquid',
  'cta.liquid',
  'footer.liquid',
];

const css = [read('assets/critical.css'), ...SECTION_FILES.map(sectionCss)].join('\n');
const js = read('assets/theme.js');

/* The mobile bar ships its own <style> inside the snippet; lift it out. */
const mobileBarCss = (read('snippets/mobile-bar.liquid').match(/<style>([\s\S]*?)<\/style>/) || [
  '',
  '',
])[1];

/* ------------------------------------------------------------------ */
/* Demo content mirrors templates/index.json                           */
/* ------------------------------------------------------------------ */

const stats = [
  { kicker: 'Mais de', value: '15', suffix: '', label: 'Anos no mercado' },
  { kicker: 'São', value: '5', suffix: '', label: 'Lojas físicas' },
  { kicker: 'Em menos de', value: '24', suffix: 'h', label: 'A maioria dos consertos' },
  { kicker: 'São', value: '90', suffix: '', label: 'Dias de garantia no reparo' },
];

const brands = ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'LG', 'Sony', 'Asus', 'Microsoft'];

const services = [
  ['wrench', 'Conserto de celular', 'Troca de tela, bateria, conectores e reparo de placa — em aparelhos de todas as marcas.'],
  ['laptop', 'Notebook e PC', 'Manutenção, limpeza, upgrade e reparo de notebooks e computadores.'],
  ['gamepad', 'Consoles', 'Manutenção e reparo de videogames e controles.'],
  ['shield', 'Película e capinha', 'Instalação de película na hora e capinhas para os principais modelos.'],
  ['wrench', 'Informática em geral', 'Acessórios, periféricos e serviços de informática no balcão.'],
  ['clock', 'Avaliação antes do orçamento', 'O aparelho é avaliado primeiro, e só depois passamos o orçamento para você decidir.'],
];

const steps = [
  ['search', 'Avaliação', 'Você leva o aparelho em uma das nossas lojas e nossa equipe identifica o problema.'],
  ['document', 'Orçamento', 'Passamos o orçamento do serviço. Você decide se quer seguir, sem compromisso.'],
  ['wrench', 'Conserto', 'Aprovado o orçamento, o reparo é executado pela nossa equipe técnica.'],
];

const stepIcon = {
  search: 'icon-search.svg',
  document: 'icon-document.svg',
  wrench: 'icon-wrench.svg',
};

const stores = [
  ['Especell Maestro', 'Curitiba', 'R. Maestro Carlos Frank, 2812 — Boqueirão, Curitiba/PR, 81750-400 (anexo ao Jacomar, loja 4)', '(41) 99903-1636'],
  ['Especell Novo Mundo', 'Curitiba', 'R. Pedro Gusso, 1089 — Novo Mundo, Curitiba/PR, 81050-200 (anexo ao Jacomar, loja 3)', '(41) 99895-0941'],
  ['Especell BR277', 'Curitiba', 'R. Eunice Bettini Bartoszeck, 1990 — Uberaba, Curitiba/PR (anexo ao Jacomar, loja 3)', '(41) 99941-6986'],
  ['Especell Guatupê', 'São José dos Pinhais', 'Av. Tomás Carmeliano de Miranda, 345 — Guatupê, São José dos Pinhais/PR, 83060-196 (anexo ao Jacomar, loja 3)', '(41) 3385-1617'],
  ['Especell Costeira', 'São José dos Pinhais', 'Alameda Arpo, 1929 — Costeira, São José dos Pinhais/PR, 83010-290 (anexo ao Jacomar, loja 3)', '(41) 3282-3242'],
];

const faqs = [
  ['Quais aparelhos vocês consertam?', 'Celulares, notebooks, computadores e consoles, além de serviços de informática em geral.'],
  ['Vocês atendem todas as marcas?', 'Sim. Trabalhamos com aparelhos de todos os fabricantes.'],
  ['Como funciona o atendimento?', 'Primeiro fazemos a avaliação do aparelho, depois passamos o orçamento. O conserto só é feito após a sua aprovação.'],
  ['Onde ficam as lojas?', 'Todas as nossas unidades ficam dentro do Jacomar, uma em cada loja: Maestro, Novo Mundo e BR277 em Curitiba, e Guatupê e Costeira na região metropolitana.'],
  ['A avaliação tem custo?', 'Não. A avaliação do aparelho é gratuita. Você só decide se quer seguir depois de receber o orçamento.'],
  ['Qual o prazo de um conserto?', 'A maioria dos consertos fica pronta em menos de 24 horas. Reparos mais complexos, como placa ou aparelho que teve contato com líquido, podem levar mais tempo — o prazo é informado no orçamento.'],
  ['Os serviços têm garantia?', 'Sim. Os reparos têm 90 dias de garantia sobre o serviço executado: se o aparelho voltar a apresentar o mesmo problema, a gente resolve. A garantia não cobre danos novos, como queda, impacto ou contato com líquido depois da retirada.'],
];

const serviceIcon = {
  wrench: 'icon-wrench.svg',
  shield: 'icon-shield.svg',
  clock: 'icon-clock.svg',
  laptop: 'icon-laptop.svg',
  gamepad: 'icon-gamepad.svg',
};

const brandList = (hidden) => `
  <ul class="brands__list"${hidden ? ' aria-hidden="true"' : ''}>
    ${brands.map((b) => `<li class="brands__item"><span class="brands__name">${b}</span></li>`).join('')}
  </ul>`;

const body = `
<div class="reading-progress" aria-hidden="true"><span data-reading-progress></span></div>

<div class="preview-banner">Prévia do tema Especell — gerada a partir do CSS e do JS reais do tema</div>

<div class="topbar">
  <div class="topbar__inner">
    <span class="topbar__note">Assistência técnica especializada · 5 lojas em Curitiba e região</span>
    <span class="topbar__contacts">
      <a href="#">${icon('icon-phone.svg')} (41) 99903-1636</a>
      <a href="#">${icon('icon-whatsapp.svg')} WhatsApp</a>
    </span>
  </div>
</div>

<header class="site-header" data-site-header>
  <div class="site-header__inner">
    <a href="#" class="site-header__logo"><span class="site-header__logo-text">Especell</span></a>
    <nav class="site-header__nav">
      <a href="#servicos" class="site-header__nav-link">Serviços</a>
      <a href="#como-funciona" class="site-header__nav-link">Como funciona</a>
      <a href="#lojas" class="site-header__nav-link">Lojas</a>
      <a href="#faq" class="site-header__nav-link">Dúvidas</a>
    </nav>
    <a href="#" class="btn btn--accent btn--sm site-header__cta">Agendar agora</a>
    <button type="button" class="site-header__toggle" data-menu-toggle aria-expanded="false" aria-label="Abrir menu">${icon('icon-menu.svg')}</button>
  </div>
  <div class="site-header__mobile" data-mobile-menu>
    <nav>
      <a href="#servicos">Serviços</a>
      <a href="#como-funciona">Como funciona</a>
      <a href="#lojas">Lojas</a>
      <a href="#faq">Dúvidas</a>
      <a href="#" class="btn btn--accent">Agendar agora</a>
    </nav>
  </div>
</header>

<section class="hero bg-ink">
  <div class="hero__stage">
    <div class="fx-bg" aria-hidden="true">
      <div class="fx-grid"></div>
      <div class="fx-glow"></div>
      <div class="hero__slash"></div>
      <div class="hero__edge"></div>
    </div>
    <div class="hero__inner">
      <div class="hero__copy">
        <span class="eyebrow" data-animate>Especialistas em consertos desde 2010</span>
        <h1 class="hero__title" data-animate>Seu aparelho nas mãos de quem entende</h1>
        <p class="hero__description" data-animate>Assistência técnica em celular, notebook, PC e console. Cinco lojas físicas em Curitiba e região metropolitana, com atendimento presencial e avaliação antes do orçamento.</p>
        <div class="hero__actions" data-animate>
          <a href="#" class="btn btn--accent" data-magnetic>Fazer orçamento ${icon('icon-arrow-right.svg')}</a>
          <a href="#servicos" class="btn btn--outline">Ver serviços</a>
        </div>
        <ul class="hero__trust" data-animate>
          <li>${icon('icon-check.svg')}<span>Avaliação gratuita</span></li>
          <li>${icon('icon-check.svg')}<span>Todas as lojas dentro do Jacomar</span></li>
        </ul>
      </div>
      <div class="hero__media" data-animate>
        <div class="hero__media-frame hero__media-frame--empty">
          <div class="media-placeholder media-placeholder--dark">Envie aqui a foto de destaque</div>
        </div>
      </div>
    </div>
  </div>
  <div class="hero__stats">
    <div class="hero__stats-inner">
      ${stats
        .map(
          (s, i) => `<div class="hero__stat${i === 0 ? ' hero__stat--featured' : ''}" data-animate>
        ${s.kicker ? `<span class="hero__stat-kicker">${s.kicker}</span>` : ''}
        <p class="hero__stat-value">${s.value ? `<span data-counter="${s.value}">${s.value}</span>` : ''}${s.suffix}</p>
        <span class="hero__stat-rule" aria-hidden="true"></span>
        <p class="hero__stat-label">${s.label}</p>
      </div>`
        )
        .join('')}
    </div>
  </div>
</section>

<section class="brands">
  <div class="brands__inner">
    <p class="brands__heading" data-animate>Consertamos todas as marcas</p>
    <div class="brands__viewport">
      <div class="brands__track" style="--marquee-duration: 35s">
        ${brandList(false)}${brandList(true)}
      </div>
    </div>
  </div>
</section>

<section class="services section" id="servicos">
  <div class="section__inner">
    <div class="section__intro section__intro--center" data-animate>
      <span class="eyebrow">O que fazemos</span>
      <h2 class="section__title">Nossos serviços</h2>
      <p class="section__description">Consertos e acessórios para celular, notebook, PC e console — com avaliação feita antes de qualquer orçamento.</p>
    </div>
    <div class="services__grid">
      ${services
        .map(
          ([ic, title, desc]) => `<article class="services__card card card--interactive" data-animate data-tilt>
        <span class="icon-tile">${icon(serviceIcon[ic])}</span>
        <h3 class="services__card-title">${title}</h3>
        <p class="services__card-text">${desc}</p>
      </article>`
        )
        .join('')}
    </div>
    <p class="services__footnote" data-animate>Valores sob avaliação. Preencha aqui a observação que você quiser sobre preços e condições.</p>
  </div>
</section>

<section class="how bg-ink section" id="como-funciona">
  <div class="fx-bg" aria-hidden="true">
    <div class="fx-grid"></div>
    <div class="fx-glow fx-glow--left"></div>
  </div>
  <div class="section__inner">
    <div class="section__intro" data-animate>
      <span class="eyebrow">Passo a passo</span>
      <h2 class="section__title">Como funciona</h2>
      <p class="section__description">Um processo simples e sem surpresa: você só aprova o serviço depois de saber exatamente o que será feito.</p>
    </div>
    <div class="how__wrap">
      <div class="how__track" aria-hidden="true" data-animate><span class="how__track-fill"></span></div>
      <ol class="how__steps">
        ${steps
          .map(
            ([ic, title, desc], i) => `<li class="how__step" data-animate>
          <span class="how__ghost" aria-hidden="true">0${i + 1}</span>
          <span class="how__dot" aria-hidden="true"></span>
          <span class="how__icon">${icon(stepIcon[ic])}</span>
          <span class="how__step-number">0${i + 1}</span>
          <h3 class="how__step-title">${title}</h3>
          <p class="how__step-text">${desc}</p>
        </li>`
          )
          .join('')}
      </ol>
    </div>
  </div>
</section>

<section class="about section" id="sobre">
  <div class="section__inner about__inner">
    <div class="about__media" data-animate>
      <div class="media-frame about__frame">
        <div class="media-placeholder">Envie aqui uma foto da equipe ou da loja</div>
      </div>
      <div class="about__badge">
        <span class="about__badge-value">2010</span>
        <span class="about__badge-label">Desde</span>
      </div>
    </div>
    <div class="about__copy">
      <div data-animate>
        <span class="eyebrow">Quem somos</span>
        <h2 class="section__title">Especialistas em consertos desde 2010</h2>
      </div>
      <div class="about__body" data-animate>
        <p>A Especell é uma assistência técnica especializada em celular, notebook, PC e console, no mercado desde 2010.</p>
        <p>Hoje somos cinco lojas físicas em Curitiba e região metropolitana, com atendimento presencial e equipe técnica própria.</p>
      </div>
      <ul class="about__points">
        ${[
          ['Todas as marcas', 'Atendemos aparelhos de todos os fabricantes.'],
          ['5 lojas físicas', 'Curitiba e região metropolitana.'],
          ['Atendimento presencial', 'Você fala com a equipe cara a cara, na loja.'],
        ]
          .map(
            ([t, d]) => `<li class="about__point" data-animate>
          <span class="about__point-icon">${icon('icon-shield.svg')}</span>
          <span><strong>${t}</strong><span class="about__point-text">${d}</span></span>
        </li>`
          )
          .join('')}
      </ul>
      <a href="#lojas" class="btn btn--dark about__cta" data-animate data-magnetic>Ver nossas lojas ${icon('icon-arrow-right.svg')}</a>
    </div>
  </div>
</section>

<section class="stores section bg-ink" id="lojas">
  <div class="fx-bg" aria-hidden="true">
    <div class="fx-grid"></div>
    <div class="fx-glow"></div>
  </div>
  <div class="section__inner">
    <div class="section__intro section__intro--center" data-animate>
      <span class="eyebrow">Onde estamos</span>
      <h2 class="section__title">Nossas lojas</h2>
      <p class="section__description">Cinco unidades para atender você. Escolha a mais próxima e fale direto com a loja.</p>
    </div>
    <div class="stores__grid">
      ${stores
        .map(
          ([name, city, address, phone]) => `<article class="stores__card card card--dark card--interactive" data-animate>
        <div class="stores__media media-frame">
          <div class="media-placeholder">Envie aqui a foto da fachada</div>
          <div class="stores__tags">
            <span class="stores__tag stores__tag--city">${city}</span>
            <span class="stores__tag stores__tag--venue">Dentro do Jacomar</span>
          </div>
        </div>
        <div class="stores__body">
          <h3 class="stores__name">${name}</h3>
          <p class="stores__address"><span class="stores__meta-icon">${icon('icon-map-pin.svg')}</span><span>${address}</span></p>
          <a href="#" class="stores__phone"><span class="stores__meta-icon">${icon('icon-phone.svg')}</span><span>${phone}</span></a>
          <div class="stores__actions">
            <a href="#" class="btn btn--accent btn--sm">${icon('icon-whatsapp.svg')} WhatsApp</a>
            <a href="#" class="btn btn--outline btn--sm stores__map-btn">Como chegar</a>
          </div>
        </div>
      </article>`
        )
        .join('')}
    </div>
  </div>
</section>

<section class="testimonials section">
  <div class="section__inner">
    <div class="section__intro section__intro--center" data-animate>
      <span class="eyebrow">Depoimentos</span>
      <h2 class="section__title">O que dizem nossos clientes</h2>
      <p class="section__description">Os cards abaixo são exemplos. Substitua pelas avaliações reais que vocês já recebem no Google e no Instagram.</p>
    </div>
    <div class="testimonials__grid">
      ${[1, 2, 3]
        .map(
          () => `<figure class="testimonials__card card card--interactive" data-animate>
        <span class="testimonials__flag">Exemplo — substituir por avaliação real</span>
        <span class="testimonials__quote" aria-hidden="true">&ldquo;</span>
        <blockquote class="testimonials__text">Cole aqui uma avaliação real de cliente (Google, Instagram ou WhatsApp).</blockquote>
        <figcaption class="testimonials__author">
          <span class="testimonials__name">Nome do cliente</span>
        </figcaption>
      </figure>`
        )
        .join('')}
    </div>
  </div>
</section>

<section class="faq section bg-muted" id="faq">
  <div class="fx-bg" aria-hidden="true">
    <div class="fx-grid fx-grid--light"></div>
  </div>
  <div class="section__inner faq__inner">
    <div class="faq__intro" data-animate>
      <span class="eyebrow">Perguntas frequentes</span>
      <h2 class="section__title">Dúvidas frequentes</h2>
      <p class="section__description">Não encontrou o que procurava? Fale com a loja mais próxima de você.</p>
      <a href="#" class="btn btn--dark faq__cta">Falar com a Especell</a>
    </div>
    <div class="faq__list" data-accordion>
      ${faqs
        .map(
          ([q, a]) => `<details class="faq__item" data-animate>
        <summary class="faq__question"><span>${q}</span><span class="faq__icon" aria-hidden="true"></span></summary>
        <div class="faq__answer"><p>${a}</p></div>
      </details>`
        )
        .join('')}
    </div>
  </div>
</section>

<section class="cta bg-ink">
  <div class="cta__glow" aria-hidden="true"></div>
  <div class="cta__inner" data-animate>
    <span class="eyebrow">Atendimento</span>
    <h2 class="cta__title">Quebrou? Estragou? Não está carregando?</h2>
    <p class="cta__description">Fale com a loja Especell mais próxima de você e descubra o que dá para fazer pelo seu aparelho.</p>
    <div class="cta__actions">
      <a href="#" class="btn btn--accent" data-magnetic>${icon('icon-whatsapp.svg')} Falar no WhatsApp</a>
      <a href="#lojas" class="btn btn--outline">Ver nossas lojas</a>
    </div>
  </div>
</section>

<footer class="site-footer bg-ink">
  <div class="site-footer__inner">
    <div class="site-footer__brand">
      <p class="site-footer__name">Especell</p>
      <p class="site-footer__tagline">Especialistas em consertos de celular, notebook, PC e console. No mercado desde 2010.</p>
      <div class="site-footer__social">
        <a href="#" aria-label="WhatsApp">${icon('icon-whatsapp.svg')}</a>
        <a href="#" aria-label="Instagram">${icon('icon-instagram.svg')}</a>
        <a href="#" aria-label="Telefone">${icon('icon-phone.svg')}</a>
      </div>
    </div>
    <div class="site-footer__column">
      <p class="site-footer__column-title">Navegação</p>
      <ul class="site-footer__menu">
        <li><a href="#servicos">Serviços</a></li>
        <li><a href="#lojas">Lojas</a></li>
        <li><a href="#faq">Dúvidas</a></li>
      </ul>
    </div>
    <div class="site-footer__column">
      <p class="site-footer__column-title">Lojas</p>
      <div class="site-footer__text">
        <p>Maestro · Novo Mundo · BR277<br>Curitiba/PR</p>
        <p>Guatupê · Costeira<br>São José dos Pinhais/PR</p>
      </div>
    </div>
  </div>
  <div class="site-footer__bottom">
    <span>&copy; 2026 Especell. Todos os direitos reservados.</span>
    <span class="site-footer__legal">Atendimento presencial nas lojas físicas.</span>
  </div>
</footer>

<div class="floating-actions">
  <button type="button" class="floating-actions__btn floating-actions__btn--top" data-back-to-top aria-label="Voltar ao topo" hidden>${icon('icon-arrow-up.svg')}</button>
  <a href="#" class="floating-actions__btn floating-actions__btn--wa" aria-label="Falar no WhatsApp">
    <span class="floating-actions__pulse" aria-hidden="true"></span>
    ${icon('icon-whatsapp.svg')}
  </a>
</div>

<div class="mobile-bar">
  <a href="#" class="mobile-bar__btn mobile-bar__btn--accent">${icon('icon-whatsapp.svg')}<span>WhatsApp</span></a>
  <a href="#" class="mobile-bar__btn">${icon('icon-phone.svg')}<span>Ligar</span></a>
</div>
`;

const html = `<!doctype html>
<html lang="pt-BR" class="js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prévia — Tema Especell</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@600;700&family=Assistant:wght@400;600;700&display=swap" rel="stylesheet">
<style>
/* Mirrors snippets/css-variables.liquid using the schema defaults */
:root {
  --font-primary--family: 'Assistant', sans-serif;
  --font-heading--family: 'Archivo Narrow', sans-serif;
  --page-width: 90rem;
  --page-margin: 20px;
  --color-background: #F5F6F8;
  --color-foreground: #14161A;
  --color-ink: #0A0A0A;
  --color-accent: #E2FF1A;
  --style-border-radius-inputs: 0px;
}
.preview-banner {
  background: #111;
  color: #E2FF1A;
  text-align: center;
  padding: .55rem;
  font-family: 'Archivo Narrow', sans-serif;
  font-size: .74rem;
  text-transform: uppercase;
  letter-spacing: .1em;
}
/* Sections are full-width here; in Shopify the .shopify-section grid handles it */
.hero, .brands, .cta, .site-footer, .how, .stores, .faq { width: 100%; }
${css}
${mobileBarCss}
</style>
</head>
<body>
${body}
<script>
${js}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'preview.html'), html, 'utf8');
console.log('preview.html gerado — ' + Math.round(html.length / 1024) + ' KB');
