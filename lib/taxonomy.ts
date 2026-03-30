// lib/taxonomy.ts
// ─────────────────────────────────────────────────────────────────
// TAXONOMY — 4 pillars, ~80 categories, ~550 keywords
// Built for a Romanian engineering high school alumni context.
//
// Groups:
//   'mentorat' — situations people write about in Ce pot oferi / Ce am nevoie
//   'hobby'    — complements the structured hobby tags in the app
//   'domeniu'  — professional domains
//   'profesie' — specific job titles
// ─────────────────────────────────────────────────────────────────

export type TaxonomyGroup = 'mentorat' | 'hobby' | 'domeniu' | 'profesie'

export interface TaxonomyCategory {
  slug: string
  label: string
  group: TaxonomyGroup
  keywords: readonly string[]
}

// ════════════════════════════════════════════════════════════════
// PILLAR 1 — SITUAȚII DE MENTORAT
// What people write in "Ce pot oferi" / "Ce am nevoie"
// ════════════════════════════════════════════════════════════════

const MENTORAT: TaxonomyCategory[] = [
  {
    slug: 'primul-job',
    label: 'Primul job',
    group: 'mentorat',
    keywords: [
      'primul job', 'prima angajare', 'entry level', 'junior',
      'abia am terminat', 'proaspăt absolvent', 'nu am experiență',
      'internship', 'stagiu', 'începător', 'job după facultate',
    ],
  },
  {
    slug: 'schimbare-cariera',
    label: 'Schimbare de carieră',
    group: 'mentorat',
    keywords: [
      'schimbare de carieră', 'reconversie', 'pivot', 'alt domeniu',
      'vreau să schimb', 'tranziție profesională', 'carieră nouă',
      'trec în', 'mă reprofilez',
    ],
  },
  {
    slug: 'relocare-expat',
    label: 'Relocare / Expat',
    group: 'mentorat',
    keywords: [
      'mutare', 'relocation', 'expat', 'emigrat', 'altă țară',
      'diaspora', 'plecat din România', 'muncesc în afară',
      'trăiesc în afară', 'mutat la', 'lucrez în Germania',
      'lucrez în UK', 'lucrez în Olanda', 'lucrez în Austria',
    ],
  },
  {
    slug: 'antreprenoriat',
    label: 'Antreprenoriat / Startup',
    group: 'mentorat',
    keywords: [
      'startup', 'fondator', 'co-founder', 'bootstrapped',
      'propria firmă', 'SRL', 'produs propriu', 'freelance',
      'independent', 'antreprenor', 'afacere proprie',
      'lansez un produs', 'construiesc un startup',
    ],
  },
  {
    slug: 'burnout-recuperare',
    label: 'Burnout & recuperare',
    group: 'mentorat',
    keywords: [
      'burnout', 'epuizare', 'obosit profesional', 'pauză',
      'work-life balance', 'prea mult stress', 'recuperare',
      'sănătate mentală', 'anxietate profesională', 'overwhelmed',
    ],
  },
  {
    slug: 'promovare-avansare',
    label: 'Promovare / Avansare',
    group: 'mentorat',
    keywords: [
      'promovare', 'avansare', 'senior', 'vrei să fii lead',
      'urcare în carieră', 'next level', 'creștere profesională',
      'cum avansez', 'mă pregătesc pentru senior',
    ],
  },
  {
    slug: 'negociere-salariu',
    label: 'Negociere salariu / ofertă',
    group: 'mentorat',
    keywords: [
      'negociere salariu', 'mărire de salariu', 'compensație',
      'pachet salarial', 'raise', 'negociere ofertă',
      'cât să cer', 'benchmark salarial', 'ofertă job',
    ],
  },
  {
    slug: 'pregatire-interviu',
    label: 'Pregătire interviu',
    group: 'mentorat',
    keywords: [
      'interviu', 'pregătire interviu', 'technical interview',
      'coding interview', 'behavioral interview', 'HR interview',
      'system design', 'whiteboard', 'mock interview',
      'cum mă pregătesc pentru interviu',
    ],
  },
  {
    slug: 'munca-remote',
    label: 'Muncă remote',
    group: 'mentorat',
    keywords: [
      'remote', 'telemuncă', 'work from home', 'distributed team',
      'async work', 'remote first', 'full remote', 'hybrid',
      'lucrez de acasă', 'echipă distribuită',
    ],
  },
  {
    slug: 'studii-strainatate',
    label: 'Studii în străinătate / MBA',
    group: 'mentorat',
    keywords: [
      'master în afară', 'doctorat în afară', 'bursă',
      'Erasmus', 'studii în străinătate', 'admitere universitate',
      'MBA', 'aplicat la master', 'aplicat la PhD',
      'universitate în Germania', 'universitate în UK',
    ],
  },
  {
    slug: 'tranzitie-management',
    label: 'Prima tranziție la management',
    group: 'mentorat',
    keywords: [
      'prima dată manager', 'tranziție la management',
      'tech lead', 'people manager', 'engineering manager',
      'team lead', 'cum devin manager', 'de la developer la manager',
      'leading a team', 'managing people',
    ],
  },
  {
    slug: 'freelancing-consulting',
    label: 'Freelancing / Consulting',
    group: 'mentorat',
    keywords: [
      'freelance', 'independent contractor', 'consultant',
      'proprii clienți', 'rate orar', 'contract part-time',
      'muncesc pe cont propriu', 'cum găsesc clienți',
    ],
  },
  {
    slug: 'productivitate-organizare',
    label: 'Productivitate & organizare',
    group: 'mentorat',
    keywords: [
      'productivitate', 'time management', 'focus',
      'organizare', 'prioritizare', 'procrastinare', 'disciplină',
      'GTD', 'deep work', 'second brain',
    ],
  },
  {
    slug: 'reconversie-it',
    label: 'Reconversie în IT (fără background tehnic)',
    group: 'mentorat',
    keywords: [
      'reconversie tech', 'bootcamp', 'self-taught', 'autodidact',
      'tranziție în IT', 'fără facultate de informatică',
      'am intrat în IT', 'nu am studii tehnice',
      'am învățat singur', 'curs de programare',
    ],
  },
  {
    slug: 'finantare-vc',
    label: 'Finanțare & investitori',
    group: 'mentorat',
    keywords: [
      'finanțare startup', 'investitori', 'venture capital', 'VC',
      'angel investor', 'pitch deck', 'funding', 'pre-seed',
      'seed round', 'dilution', 'term sheet', 'due diligence',
    ],
  },
  {
    slug: 'academia-cercetare',
    label: 'Carieră academică / Cercetare',
    group: 'mentorat',
    keywords: [
      'cercetare', 'doctorat', 'PhD', 'publicații', 'articole științifice',
      'carieră academică', 'profesor universitar', 'cercetător',
      'grant de cercetare', 'postdoc', 'laboratoare',
    ],
  },
  {
    slug: 'work-life-familie',
    label: 'Work-life balance & familie',
    group: 'mentorat',
    keywords: [
      'echilibru viață profesională', 'familie și carieră',
      'timp pentru familie', 'copii și job', 'parenting și carieră',
      'limite sănătoase', 'concediu parental', 'revenire după concediu',
    ],
  },
  {
    slug: 'networking-profesional',
    label: 'Networking profesional',
    group: 'mentorat',
    keywords: [
      'networking', 'conexiuni profesionale', 'LinkedIn',
      'construiesc o rețea', 'comunitate profesională',
      'conferințe', 'meetup-uri', 'cum mă promovez',
    ],
  },
]

// ════════════════════════════════════════════════════════════════
// PILLAR 2 — HOBBY-URI
// ════════════════════════════════════════════════════════════════

const HOBBY: TaxonomyCategory[] = [
  {
    slug: 'muzica-instrumente',
    label: 'Muzică — instrumente',
    group: 'hobby',
    keywords: [
      'chitară', 'pian', 'tobe', 'baterie', 'vioară', 'bass',
      'instrumente muzicale', 'cânt la', 'trupă', 'band',
      'repetiții', 'înregistrări', 'studio muzical',
    ],
  },
  {
    slug: 'muzica-productie',
    label: 'Muzică — producție / DJ',
    group: 'hobby',
    keywords: [
      'producție muzicală', 'mixing', 'mastering', 'DAW',
      'Ableton', 'FL Studio', 'Logic Pro', 'beat making',
      'producer muzical', 'DJ', 'muzică electronică', 'EDM',
    ],
  },
  {
    slug: 'sport-echipa',
    label: 'Sporturi de echipă',
    group: 'hobby',
    keywords: [
      'fotbal', 'baschet', 'volei', 'handbal', 'rugby',
      'sport de echipă', 'joc de echipă', 'antrenamente fotbal',
      'meciuri', 'turneu sportiv',
    ],
  },
  {
    slug: 'sport-individual',
    label: 'Sporturi individuale',
    group: 'hobby',
    keywords: [
      'tenis', 'înot', 'atletism', 'alergare', 'maraton',
      'ciclism', 'triathlon', 'schi', 'patinaj', 'box',
      'kickbox', 'karate', 'judo', 'MMA', 'arte marțiale',
    ],
  },
  {
    slug: 'drumetii-outdoor',
    label: 'Drumeții / Outdoor',
    group: 'hobby',
    keywords: [
      'drumeții', 'munte', 'trekking', 'hiking', 'via ferrata',
      'camping', 'Carpați', 'trasee montane', 'natură',
      'orientare', 'expediții', 'escaladă', 'climbing',
    ],
  },
  {
    slug: 'fitness-gym',
    label: 'Fitness / Gym',
    group: 'hobby',
    keywords: [
      'sală', 'fitness', 'gym', 'antrenament', 'powerlifting',
      'crossfit', 'calistenie', 'bodybuilding', 'haltere',
      'progres fizic', 'nutriție sportivă',
    ],
  },
  {
    slug: 'fotografie-video',
    label: 'Fotografie / Film',
    group: 'hobby',
    keywords: [
      'fotografie', 'foto', 'video', 'cameră foto', 'DSLR',
      'mirrorless', 'editare foto', 'Lightroom', 'Photoshop',
      'Premiere', 'cinematografie', 'filmmaker', 'scurt metraje',
    ],
  },
  {
    slug: 'arte-vizuale',
    label: 'Arte vizuale',
    group: 'hobby',
    keywords: [
      'pictură', 'desen', 'artă', 'ilustrație', 'grafică',
      'sculptură', 'artă vizuală', 'creație artistică',
      'acuarelă', 'ulei pe pânză', 'artă digitală',
    ],
  },
  {
    slug: 'gaming',
    label: 'Gaming',
    group: 'hobby',
    keywords: [
      'gaming', 'jocuri video', 'PC gaming', 'console',
      'PlayStation', 'Xbox', 'Nintendo', 'esports',
      'Steam', 'competitive gaming', 'streamer',
    ],
  },
  {
    slug: 'lectura-carti',
    label: 'Lectură',
    group: 'hobby',
    keywords: [
      'lectură', 'cărți', 'citit', 'bibliofil', 'romane',
      'non-fiction', 'book club', 'recomandări de cărți',
      'sci-fi', 'filosofie', 'biografie', 'self-development',
    ],
  },
  {
    slug: 'calatorii-travel',
    label: 'Călătorii',
    group: 'hobby',
    keywords: [
      'călătorii', 'travel', 'turism', 'backpacking',
      'explorare', 'nomad digital', 'city break',
      'experiențe noi', 'culturi diferite', 'pasaport plin',
    ],
  },
  {
    slug: 'gatit-culinare',
    label: 'Gătit / Culinar',
    group: 'hobby',
    keywords: [
      'gătit', 'bucătărie', 'culinar', 'rețete', 'cooking',
      'patiserie', 'baking', 'fermentare', 'cocktailuri',
      'food photography', 'restaurant reviews',
    ],
  },
  {
    slug: 'vin-cafea-bere',
    label: 'Vin / Cafea / Craft beer',
    group: 'hobby',
    keywords: [
      'vin', 'viticultură', 'degustare vin', 'sommelier',
      'cafea', 'barista', 'specialty coffee', 'espresso',
      'craft beer', 'bere artizanală', 'homebrewing',
    ],
  },
  {
    slug: 'voluntariat-civic',
    label: 'Voluntariat / Civic',
    group: 'hobby',
    keywords: [
      'voluntariat', 'ONG', 'implicare civică', 'comunitate locală',
      'social impact', 'activism', 'fundraising', 'asociație',
      'proiecte sociale', 'mediu înconjurător',
    ],
  },
  {
    slug: 'dans',
    label: 'Dans',
    group: 'hobby',
    keywords: [
      'dans', 'salsa', 'tango', 'bachata', 'contemporan',
      'hip-hop dans', 'coregrafie', 'dansat', 'folk românesc',
      'dans sportiv', 'spectacol de dans',
    ],
  },
  {
    slug: 'teatru-improv',
    label: 'Teatru / Improvizație',
    group: 'hobby',
    keywords: [
      'teatru', 'actorie', 'scenă', 'improvizație', 'improv',
      'dramaturgie', 'spectacol', 'trupa de teatru',
    ],
  },
  {
    slug: 'yoga-meditatie',
    label: 'Yoga / Meditație / Mindfulness',
    group: 'hobby',
    keywords: [
      'yoga', 'meditație', 'mindfulness', 'respirație',
      'wellness', 'zen', 'Wim Hof', 'cold therapy',
      'journaling', 'stoicism', 'stoic',
    ],
  },
  {
    slug: 'programare-sideprojects',
    label: 'Programare — side projects',
    group: 'hobby',
    keywords: [
      'proiecte personale', 'side project', 'open source',
      'hackathon', 'coding pentru fun', 'hobby tech',
      'construiesc o aplicație', 'contribuie la OSS',
      'indie hacker', 'maker',
    ],
  },
  {
    slug: 'limbi-straine',
    label: 'Limbi străine',
    group: 'hobby',
    keywords: [
      'limbi străine', 'limbă nouă', 'engleză', 'germană',
      'franceză', 'spaniolă', 'italiană', 'japoneză',
      'chineză', 'Duolingo', 'cursuri de limbă',
    ],
  },
  {
    slug: 'sah-jocuri-minte',
    label: 'Șah / Jocuri de strategie',
    group: 'hobby',
    keywords: [
      'șah', 'chess', 'Chess.com', 'go', 'backgammon',
      'puzzle', 'jocuri de logică', 'jocuri de societate',
      'strategie', 'bridge', 'scrabble',
    ],
  },
  {
    slug: 'podcast-content',
    label: 'Podcast / Content creation',
    group: 'hobby',
    keywords: [
      'podcast', 'YouTube', 'content creator', 'blogging',
      'newsletter', 'social media creator', 'vlogging',
      'Substack', 'Medium', 'TikTok creator',
    ],
  },
  {
    slug: 'natura-ecologie',
    label: 'Natură / Ecologie',
    group: 'hobby',
    keywords: [
      'natură', 'ecologie', 'mediu înconjurător', 'sustenabilitate',
      'grădinărit', 'birdwatching', 'astronomie', 'reciclare',
      'zero waste', 'permacultură',
    ],
  },
]

// ════════════════════════════════════════════════════════════════
// PILLAR 3 — DOMENII PROFESIONALE
// ════════════════════════════════════════════════════════════════

const DOMENIU: TaxonomyCategory[] = [
  {
    slug: 'software-web',
    label: 'Software — Web',
    group: 'domeniu',
    keywords: [
      'web development', 'frontend', 'backend', 'fullstack',
      'React', 'Next.js', 'Node.js', 'TypeScript', 'JavaScript',
      'Vue', 'Angular', 'web dev', 'SPA', 'REST API', 'GraphQL',
    ],
  },
  {
    slug: 'software-mobile',
    label: 'Software — Mobile',
    group: 'domeniu',
    keywords: [
      'mobile development', 'iOS', 'Android', 'React Native',
      'Flutter', 'Swift', 'Kotlin', 'app development',
      'cross-platform', 'aplicație mobilă',
    ],
  },
  {
    slug: 'software-embedded',
    label: 'Software — Embedded / Automotive',
    group: 'domeniu',
    keywords: [
      'automotive', 'embedded', 'AUTOSAR', 'CAN bus',
      'ISO 26262', 'ADAS', 'ECU', 'industria auto',
      'firmware', 'bare-metal', 'RTOS', 'microcontroller',
      'STM32', 'Arduino profesional', 'sisteme embedded',
    ],
  },
  {
    slug: 'devops-cloud',
    label: 'DevOps / Cloud',
    group: 'domeniu',
    keywords: [
      'DevOps', 'cloud', 'AWS', 'Azure', 'GCP',
      'Kubernetes', 'Docker', 'CI/CD', 'infrastructure',
      'Terraform', 'Ansible', 'SRE', 'platform engineering',
      'serverless', 'microservices',
    ],
  },
  {
    slug: 'data-analytics',
    label: 'Data / Analytics',
    group: 'domeniu',
    keywords: [
      'data', 'analytics', 'business intelligence', 'BI',
      'Power BI', 'Tableau', 'SQL', 'data analyst',
      'data engineering', 'ETL', 'data warehouse', 'Snowflake',
      'dbt', 'Looker',
    ],
  },
  {
    slug: 'ai-ml',
    label: 'AI / Machine Learning',
    group: 'domeniu',
    keywords: [
      'machine learning', 'AI', 'LLM', 'GPT', 'data science',
      'deep learning', 'neural network', 'NLP', 'model de limbaj',
      'PyTorch', 'TensorFlow', 'fine-tuning', 'RAG',
      'computer vision', 'MLOps',
    ],
  },
  {
    slug: 'cybersecurity',
    label: 'Cybersecurity',
    group: 'domeniu',
    keywords: [
      'securitate', 'cybersecurity', 'pentesting',
      'ethical hacking', 'securitate IT', 'infosec', 'SOC',
      'SIEM', 'incident response', 'vulnerability assessment',
      'OSINT', 'CTF',
    ],
  },
  {
    slug: 'requirements-ba',
    label: 'Requirements / Business Analysis',
    group: 'domeniu',
    keywords: [
      'requirements', 'requirements engineering', 'business analyst',
      'specificații', 'user story', 'stakeholder management',
      'DOORS', 'JIRA', 'use case', 'functional specs',
      'process mapping', 'gap analysis',
    ],
  },
  {
    slug: 'project-management',
    label: 'Project Management',
    group: 'domeniu',
    keywords: [
      'project management', 'Scrum', 'Agile', 'Kanban',
      'PMP', 'PRINCE2', 'livrare proiecte', 'program manager',
      'delivery manager', 'PMO', 'waterfall',
    ],
  },
  {
    slug: 'product-management',
    label: 'Product Management',
    group: 'domeniu',
    keywords: [
      'product management', 'product manager', 'PM',
      'roadmap', 'produs digital', 'product owner', 'PO',
      'discovery', 'product strategy', 'OKR', 'KPI produs',
      'go-to-market', 'product-led growth',
    ],
  },
  {
    slug: 'ux-ui-design',
    label: 'UX / UI Design',
    group: 'domeniu',
    keywords: [
      'UX', 'UI', 'design', 'Figma', 'user experience',
      'user research', 'product design', 'wireframes',
      'prototyping', 'design system', 'usability testing',
      'interaction design', 'service design',
    ],
  },
  {
    slug: 'finante-banking',
    label: 'Finanțe / Banking',
    group: 'domeniu',
    keywords: [
      'finanțe', 'banking', 'bancă', 'investiții',
      'piețe financiare', 'contabilitate', 'audit', 'controlling',
      'treasury', 'risk management', 'fintech',
      'corporate finance', 'M&A',
    ],
  },
  {
    slug: 'marketing-digital',
    label: 'Marketing digital',
    group: 'domeniu',
    keywords: [
      'marketing', 'digital marketing', 'SEO', 'SEM',
      'performance marketing', 'growth hacking', 'brand',
      'Google Ads', 'Meta Ads', 'email marketing',
      'content marketing', 'social media',
    ],
  },
  {
    slug: 'hr-people',
    label: 'HR / People & Culture',
    group: 'domeniu',
    keywords: [
      'HR', 'resurse umane', 'recrutare', 'talent acquisition',
      'people ops', 'employer branding', 'learning and development',
      'L&D', 'compensation', 'performance management',
      'culture', 'onboarding',
    ],
  },
  {
    slug: 'consultanta-strategie',
    label: 'Consultanță / Strategie',
    group: 'domeniu',
    keywords: [
      'consultanță', 'consulting', 'McKinsey', 'BCG', 'Bain',
      'Big4', 'Deloitte', 'PwC', 'EY', 'KPMG',
      'strategie business', 'management consulting',
      'business transformation',
    ],
  },
  {
    slug: 'medicina-sanatate',
    label: 'Medicină / Sănătate',
    group: 'domeniu',
    keywords: [
      'medicină', 'doctor', 'farmacie', 'sănătate',
      'clinică', 'spital', 'healthcare', 'medical',
      'rezidențiat', 'chirurgie', 'stomatologie', 'medicină de familie',
      'health tech',
    ],
  },
  {
    slug: 'drept-juridic',
    label: 'Drept / Juridic',
    group: 'domeniu',
    keywords: [
      'drept', 'avocat', 'juridic', 'lege', 'legislație',
      'notar', 'legal', 'drept comercial', 'drept civil',
      'drept IT', 'compliance', 'contract law', 'GDPR',
    ],
  },
  {
    slug: 'educatie-training',
    label: 'Educație / Training',
    group: 'domeniu',
    keywords: [
      'educație', 'profesor', 'formator', 'trainer',
      'eLearning', 'pedagogie', 'tutoriat', 'mentorat academic',
      'curriculum', 'instrucțional design', 'ed-tech',
    ],
  },
  {
    slug: 'inginerie-mecanica',
    label: 'Inginerie mecanică / Industrială',
    group: 'domeniu',
    keywords: [
      'inginerie mecanică', 'mecanic', 'proiectare mecanică',
      'CAD', 'SolidWorks', 'AutoCAD', 'producție industrială',
      'manufacturing', 'lean', 'Six Sigma', 'quality assurance',
      'CNC', 'inginerie industrială',
    ],
  },
  {
    slug: 'arhitectura-constructii',
    label: 'Arhitectură / Construcții',
    group: 'domeniu',
    keywords: [
      'arhitectură', 'construcții', 'urbanism', 'BIM',
      'Revit', 'inginerie civilă', 'structuri', 'rezistență',
      'instalații', 'devize', 'proiect de construcție',
    ],
  },
  {
    slug: 'telecom-retele',
    label: 'Telecom / Rețele',
    group: 'domeniu',
    keywords: [
      'telecom', 'rețele', 'networking', 'Cisco',
      '5G', '4G', 'LTE', 'telecomunicații', 'RF',
      'fibră optică', 'network engineer', 'VoIP',
    ],
  },
  {
    slug: 'energie-renewables',
    label: 'Energie / Renewables',
    group: 'domeniu',
    keywords: [
      'energie', 'renewables', 'energie regenerabilă', 'solar',
      'eolian', 'fotovoltaic', 'rețea electrică', 'smart grid',
      'eficiență energetică', 'electromobilitate',
    ],
  },
]

// ════════════════════════════════════════════════════════════════
// PILLAR 4 — PROFESII SPECIFICE
// ════════════════════════════════════════════════════════════════

const PROFESIE: TaxonomyCategory[] = [
  {
    slug: 'prof-software-engineer',
    label: 'Software Engineer',
    group: 'profesie',
    keywords: [
      'software engineer', 'software developer', 'programator',
      'developer', 'inginer software', 'SWE', 'coder',
    ],
  },
  {
    slug: 'prof-data-scientist',
    label: 'Data Scientist',
    group: 'profesie',
    keywords: [
      'data scientist', 'om de date', 'ML engineer',
      'AI researcher', 'research scientist',
    ],
  },
  {
    slug: 'prof-product-manager',
    label: 'Product Manager',
    group: 'profesie',
    keywords: [
      'product manager', 'PM', 'product owner', 'PO',
      'chief product officer', 'CPO', 'head of product',
    ],
  },
  {
    slug: 'prof-ux-designer',
    label: 'UX/UI Designer',
    group: 'profesie',
    keywords: [
      'UX designer', 'UI designer', 'product designer',
      'interaction designer', 'visual designer', 'designer',
    ],
  },
  {
    slug: 'prof-devops-engineer',
    label: 'DevOps / Platform Engineer',
    group: 'profesie',
    keywords: [
      'DevOps engineer', 'platform engineer', 'SRE',
      'cloud architect', 'cloud engineer', 'infrastructure engineer',
    ],
  },
  {
    slug: 'prof-qa-engineer',
    label: 'QA / Test Engineer',
    group: 'profesie',
    keywords: [
      'QA engineer', 'test engineer', 'tester', 'SDET',
      'automation engineer', 'quality engineer',
    ],
  },
  {
    slug: 'prof-project-manager',
    label: 'Project / Delivery Manager',
    group: 'profesie',
    keywords: [
      'project manager', 'delivery manager', 'program manager',
      'scrum master', 'agile coach',
    ],
  },
  {
    slug: 'prof-business-analyst',
    label: 'Business Analyst',
    group: 'profesie',
    keywords: [
      'business analyst', 'BA', 'systems analyst',
      'functional analyst', 'analist de business',
    ],
  },
  {
    slug: 'prof-consultant',
    label: 'Consultant',
    group: 'profesie',
    keywords: [
      'consultant', 'senior consultant', 'associate consultant',
      'management consultant', 'strategy consultant',
    ],
  },
  {
    slug: 'prof-founder-ceo',
    label: 'Founder / CEO',
    group: 'profesie',
    keywords: [
      'founder', 'co-founder', 'CEO', 'CTO', 'CMO', 'COO',
      'director general', 'managing director',
    ],
  },
  {
    slug: 'prof-marketing',
    label: 'Marketing / Growth',
    group: 'profesie',
    keywords: [
      'marketing manager', 'growth manager', 'CMO',
      'head of marketing', 'digital marketer', 'brand manager',
      'performance marketer',
    ],
  },
  {
    slug: 'prof-sales',
    label: 'Sales / Business Development',
    group: 'profesie',
    keywords: [
      'sales', 'account executive', 'account manager',
      'business development', 'BDR', 'SDR', 'sales manager',
      'vânzări', 'head of sales',
    ],
  },
  {
    slug: 'prof-engineer-mechanical',
    label: 'Inginer Mecanic / Industrial',
    group: 'profesie',
    keywords: [
      'inginer mecanic', 'mechanical engineer', 'process engineer',
      'manufacturing engineer', 'quality engineer', 'design engineer',
    ],
  },
  {
    slug: 'prof-doctor',
    label: 'Medic / Doctor',
    group: 'profesie',
    keywords: [
      'medic', 'doctor', 'chirurg', 'rezident', 'specialist',
      'physician', 'GP', 'medic de familie',
    ],
  },
  {
    slug: 'prof-avocat',
    label: 'Avocat / Jurist',
    group: 'profesie',
    keywords: [
      'avocat', 'jurist', 'consilier juridic', 'notar',
      'magistrat', 'judecător', 'procuror',
    ],
  },
  {
    slug: 'prof-arhitect',
    label: 'Arhitect',
    group: 'profesie',
    keywords: [
      'arhitect', 'architect', 'urban planner', 'urbanist',
      'interior designer', 'peisagist',
    ],
  },
]

// ════════════════════════════════════════════════════════════════
// COMBINED EXPORT
// ════════════════════════════════════════════════════════════════

export const TAXONOMY: TaxonomyCategory[] = [
  ...MENTORAT,
  ...HOBBY,
  ...DOMENIU,
  ...PROFESIE,
]

export const TAXONOMY_BY_SLUG = new Map<string, TaxonomyCategory>(
  TAXONOMY.map(c => [c.slug, c])
)

export const TAXONOMY_BY_GROUP: Record<TaxonomyGroup, TaxonomyCategory[]> = {
  mentorat: MENTORAT,
  hobby: HOBBY,
  domeniu: DOMENIU,
  profesie: PROFESIE,
}

// ─────────────────────────────────────────────────────────────────
// MATCHING UTILITY
//
// extractSlugs(text) — finds all taxonomy categories whose keywords
// appear in the given free text. Returns matched slugs sorted by
// the number of keyword hits (most relevant first).
//
// Used for scoring mentor↔mentee text overlap.
// ─────────────────────────────────────────────────────────────────

export function extractSlugs(text: string): string[] {
  if (!text) return []
  const lower = text.toLowerCase()

  const hits: { slug: string; count: number }[] = []

  for (const cat of TAXONOMY) {
    let count = 0
    for (const kw of cat.keywords) {
      if (lower.includes(kw.toLowerCase())) count++
    }
    if (count > 0) hits.push({ slug: cat.slug, count })
  }

  return hits
    .sort((a, b) => b.count - a.count)
    .map(h => h.slug)
}

// scoreSlugs(aSlugs, bSlugs) — Jaccard-style overlap score [0, 1]
// between two slug arrays (e.g. mentor offer vs mentee need).
// Returns 0 when either array is empty.

export function scoreSlugs(aSlugs: string[], bSlugs: string[]): number {
  if (aSlugs.length === 0 || bSlugs.length === 0) return 0
  const setA = new Set(aSlugs)
  const setB = new Set(bSlugs)
  const intersection = [...setA].filter(s => setB.has(s)).length
  const union = new Set([...setA, ...setB]).size
  return intersection / union
}
