const iconPaths = {
  functions: '<path d="M4 19V5m0 14h16" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/><path d="M6.5 15.5c2.4-.2 3.1-2.4 4.3-5.1C12 7.7 14 6.4 18.5 6" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/><circle cx="11" cy="10" r="1.6" fill="currentColor"/>',
  algebra: '<path d="M5 7h14M5 17h14M8 4v6m8-6v6M8 14v6m8-6v6" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/>',
  trigonometry: '<path d="M4 19 12 5l8 14H4Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/><path d="M9.5 19a5.4 5.4 0 0 1 2.7-4.7" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/>',
  geometry: '<circle cx="10" cy="12" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="m13.5 6.5 6 3.5-3.2 6.4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>',
  statistics: '<path d="M5 19V9m7 10V5m7 14v-7" stroke="currentColor" stroke-linecap="round" stroke-width="2.4"/><path d="M3 19h18" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/>',
  probability: '<rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/>',
};
const topics = [
  { id:'functions', title:'Functions', description:'Understand how quantities relate and change together', count:12, duration:'~8 hours', color:'#7c5cff', soft:'#eeeaff', formula:'f(x)', lessons:['Function notation and evaluation','Domain and range','Linear, quadratic, and exponential functions','Function transformations','Inverse functions','Composite functions'] },
  { id:'algebra', title:'Algebra', description:'Master symbolic manipulation and equation solving', count:14, duration:'~10 hours', color:'#ef5da8', soft:'#ffeaf5', formula:'x²', lessons:['Polynomial operations','Factoring techniques','Rational expressions','Solving equations and inequalities','Systems of equations','Complex numbers'] },
  { id:'trigonometry', title:'Trigonometry', description:'Explore relationships between angles and sides', count:11, duration:'~9 hours', color:'#ff9d42', soft:'#fff2e5', formula:'θ', lessons:['Unit circle and radian measure','Trigonometric ratios','Trigonometric identities','Graphs of trig functions','Solving trigonometric equations','Law of sines and cosines'] },
  { id:'geometry', title:'Geometry', description:'Study shapes, spaces, and their properties', count:10, duration:'~7 hours', color:'#2db7a3', soft:'#e5faf7', formula:'○', lessons:['Coordinate geometry','Lines and slopes','Circles and conic sections','Geometric proofs','Transformations','3D geometry basics'] },
  { id:'statistics', title:'Statistics', description:'Learn to collect, analyze, and interpret data', count:9, duration:'~6 hours', color:'#3f8cff', soft:'#e8f2ff', formula:'μ', lessons:['Measures of central tendency','Measures of spread','Data visualization','Normal distribution','Correlation and regression','Statistical inference basics'] },
  { id:'probability', title:'Probability', description:'Quantify uncertainty and predict outcomes', count:8, duration:'~6 hours', color:'#7857c8', soft:'#f0ebff', formula:'P', lessons:['Probability fundamentals','Compound events','Conditional probability','Permutations and combinations','Binomial probability','Expected value'] },
];
const paths = [
  ['Functions','Start here to build a strong foundation in mathematical relationships'],
  ['Algebra','Develop symbolic reasoning and problem-solving skills'],
  ['Trigonometry','Apply algebraic skills to circular and periodic phenomena'],
  ['Geometry','Visualize and prove relationships in space'],
  ['Statistics & Probability','Apply mathematical thinking to real-world data and uncertainty'],
];
const resources = [
  {title:'Formula Explorer',text:'Browse formulas, generate examples, and check your answers.',label:'Explore formulas',href:'explore.html',icon:'ƒx'},
  {title:'Mathematical Reasoning',text:'Understand why key mathematical ideas and formulas work.',label:'Read explanations',href:'proofs.html',icon:'∵'},
  {title:'Worked Examples',text:'Practice with generated questions and guided solutions.',label:'Start practicing',href:'explore.html',icon:'✓'},
  {title:'Curriculum Topics',text:'Review the Grade 11 topics and suggested learning path.',label:'Review topics',href:'#curriculum',icon:'∑'},
];
let selectedTopic = '';
const topicIcon = (id) => `<svg aria-hidden="true" fill="none" viewBox="0 0 24 24" width="34" height="34">${iconPaths[id]}</svg>`;

document.querySelector('#topic-shortcuts').innerHTML = topics.map((topic) => `<a href="#${topic.id}"><i style="color:${topic.color}">${topicIcon(topic.id)}</i>${topic.title}</a>`).join('');
document.querySelector('#topics-grid').innerHTML = topics.map((topic, index) => `<article class="topic-card reveal" id="${topic.id}" style="--topic-color:${topic.color};--topic-soft:${topic.soft}"><div class="card-cover"><span class="card-number">0${index + 1}</span><div class="topic-icon">${topicIcon(topic.id)}</div><div class="cover-formula">${topic.formula}</div></div><div class="card-body"><div class="card-tags"><span>${topic.count} lessons</span><span>${topic.duration}</span></div><h3>${topic.title}</h3><p>${topic.description}</p><ul>${topic.lessons.map((lesson) => `<li>${lesson}</li>`).join('')}</ul><button class="start-button" type="button" data-topic="${topic.id}">Start learning <span aria-hidden="true">›</span></button></div></article>`).join('');
document.querySelector('#path-steps').innerHTML = paths.map(([title, text], index) => `<article class="path-step reveal"><div class="path-number">${String(index + 1).padStart(2, '0')}</div><div><span>Step ${index + 1}</span><h3>${title}</h3><p>${text}</p></div></article>`).join('');
document.querySelector('#resources-grid').innerHTML = resources.map((resource, index) => `<a class="resource-card reveal" href="${resource.href}"><span class="resource-icon resource-icon-${index + 1}">${resource.icon}</span><span class="resource-index">0${index + 1}</span><h3>${resource.title}</h3><p>${resource.text}</p><strong>${resource.label} <span>→</span></strong></a>`).join('');

function chooseTopic(id) {
  selectedTopic = id;
  document.querySelectorAll('.topic-card').forEach((card) => {
    const selected = card.id === id;
    card.classList.toggle('is-selected', selected);
    const button = card.querySelector('.start-button');
    button.innerHTML = selected ? 'Course selected <span aria-hidden="true">✓</span>' : 'Start learning <span aria-hidden="true">›</span>';
  });
}

document.querySelectorAll('.start-button').forEach((button) => button.addEventListener('click', () => chooseTopic(button.dataset.topic)));
function findCourse() {
  const query = document.querySelector('#topic-search').value.trim().toLowerCase();
  const match = topics.find((topic) => topic.title.toLowerCase().includes(query));
  document.querySelectorAll('.topic-card').forEach((card) => card.classList.toggle('is-hidden', Boolean(query) && !card.id.includes(query)));
  if (match) {
    chooseTopic(match.id);
    document.querySelector(`#${match.id}`).scrollIntoView({behavior:'smooth',block:'center'});
  } else if (query) {
    document.querySelector('#curriculum').scrollIntoView({behavior:'smooth'});
  }
}
document.querySelector('#search-course').addEventListener('click', findCourse);
document.querySelector('#topic-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') findCourse(); });
document.querySelector('#topic-search').addEventListener('input', () => {
  if (!document.querySelector('#topic-search').value.trim()) document.querySelectorAll('.topic-card').forEach((card) => card.classList.remove('is-hidden'));
});
