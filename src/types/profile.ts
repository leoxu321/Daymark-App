export interface UserProfile {
  skills: UserSkills
  resumeFileName?: string
  resumeUploadedAt?: string
}

export interface UserSkills {
  languages: string[]
  frameworks: string[]
  tools: string[]
  roleTypes: string[]
  otherKeywords: string[]
}

// Predefined skill options for UI selectors
export const PROGRAMMING_LANGUAGES = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Java',
  'C++',
  'C',
  'C#',
  'Go',
  'Rust',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'Scala',
  'R',
  'MATLAB',
  'SQL',
  'Shell',
  'Bash',
  'Perl',
  'Dart',
  'Lua',
  'Haskell',
  'Elixir',
  'Erlang',
  'F#',
  'Clojure',
  'Julia',
  'Objective-C',
  'Assembly',
  'VHDL',
  'Verilog',
] as const

export const FRAMEWORKS = [
  // Frontend Frameworks
  'React',
  'Vue',
  'Angular',
  'Next.js',
  'Svelte',
  'SvelteKit',
  'Solid.js',
  'Qwik',
  'Remix',
  'Nuxt.js',
  'Astro',

  // Backend Frameworks
  'Node.js',
  'Express',
  'NestJS',
  'Django',
  'Flask',
  'FastAPI',
  'Spring',
  'Spring Boot',
  'Rails',
  'Laravel',
  'Symfony',
  '.NET',
  'ASP.NET Core',

  // Mobile Frameworks
  'React Native',
  'Flutter',
  'Ionic',
  'Xamarin',

  // ML/AI Frameworks
  'TensorFlow',
  'PyTorch',
  'Keras',
  'Scikit-learn',
  'OpenCV',
  'Hugging Face',
  'LangChain',

  // Data Frameworks
  'Pandas',
  'NumPy',
  'Apache Spark',
  'Hadoop',
  'Airflow',
  'dbt',

  // Other Frameworks
  'Hibernate',
  'gRPC',
  'GraphQL',
  'Kafka',
  'RabbitMQ',
  'Celery',
] as const

export const TOOLS = [
  // Version Control
  'Git',
  'GitHub',
  'GitLab',
  'Bitbucket',
  'SVN',

  // Containerization & Orchestration
  'Docker',
  'Kubernetes',
  'K8s',
  'Helm',
  'Rancher',

  // Cloud Platforms
  'AWS',
  'Azure',
  'GCP',
  'Vercel',
  'Netlify',
  'Railway',
  'Heroku',
  'DigitalOcean',

  // Databases
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'Elasticsearch',
  'Cassandra',
  'DynamoDB',
  'Supabase',
  'Firebase',
  'PlanetScale',
  'Neon',
  'SQLite',
  'MariaDB',

  // CI/CD
  'Jenkins',
  'GitHub Actions',
  'GitLab CI',
  'CircleCI',
  'Travis CI',
  'ArgoCD',
  'Flux',

  // Infrastructure as Code
  'Terraform',
  'Ansible',
  'Puppet',
  'Chef',
  'CloudFormation',

  // Monitoring & Observability
  'Prometheus',
  'Grafana',
  'Datadog',
  'New Relic',
  'Sentry',
  'Splunk',

  // Build Tools
  'Webpack',
  'Vite',
  'Rollup',
  'Turbopack',
  'esbuild',
  'Parcel',

  // API Tools
  'Postman',
  'Insomnia',
  'REST',
  'GraphQL',
  'gRPC',
  'Swagger',
  'OpenAPI',

  // Data Tools
  'Tableau',
  'Power BI',
  'Looker',
  'Databricks',
  'Snowflake',
  'Apache Kafka',

  // Project Management
  'Jira',
  'Confluence',
  'Trello',
  'Asana',
  'Linear',

  // Design Tools
  'Figma',
  'Sketch',
  'Adobe XD',

  // Testing Tools
  'Jest',
  'Pytest',
  'Selenium',
  'Cypress',
  'Playwright',
  'JUnit',
  'Mocha',
  'Vitest',

  // Other
  'Linux',
  'Unix',
  'macOS',
  'Windows',
  'Nginx',
  'Apache',
  'Prisma',
  'tRPC',
] as const

export const ROLE_TYPES = [
  'Software Engineer',
  'Frontend',
  'Backend',
  'Full Stack',
  'Mobile',
  'iOS',
  'Android',
  'DevOps',
  'SRE',
  'Data Science',
  'Machine Learning',
  'AI',
  'Data Engineering',
  'Data Analyst',
  'Security',
  'QA',
  'Testing',
  'Embedded',
  'Systems',
  'Cloud',
  'Infrastructure',
  'Product',
  'UX/UI',
  'Research',
] as const

export type ProgrammingLanguage = (typeof PROGRAMMING_LANGUAGES)[number]
export type Framework = (typeof FRAMEWORKS)[number]
export type Tool = (typeof TOOLS)[number]
export type RoleType = (typeof ROLE_TYPES)[number]

// Synonym mapping for skill normalization
// Maps variations to canonical form
export const SKILL_SYNONYMS: Record<string, string> = {
  // React variations
  'reactjs': 'React',
  'react.js': 'React',
  'react js': 'React',

  // Node.js variations
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node js': 'Node.js',

  // Vue variations
  'vuejs': 'Vue',
  'vue.js': 'Vue',
  'vue js': 'Vue',

  // Angular variations
  'angularjs': 'Angular',
  'angular.js': 'Angular',
  'angular js': 'Angular',

  // JavaScript variations
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'ecmascript': 'JavaScript',

  // TypeScript variations
  'ts': 'TypeScript',
  'typescript': 'TypeScript',

  // Python variations
  'python': 'Python',
  'python3': 'Python',
  'py': 'Python',

  // Java variations (NOT JavaScript!)
  'java': 'Java',

  // Kubernetes variations
  'k8s': 'Kubernetes',
  'kube': 'Kubernetes',

  // PostgreSQL variations
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'psql': 'PostgreSQL',

  // MongoDB variations
  'mongo': 'MongoDB',
  'mongodb': 'MongoDB',

  // Amazon Web Services variations
  'amazon web services': 'AWS',
  'aws': 'AWS',

  // Google Cloud variations
  'google cloud': 'GCP',
  'google cloud platform': 'GCP',
  'gcp': 'GCP',

  // Microsoft Azure variations
  'azure': 'Azure',
  'microsoft azure': 'Azure',

  // .NET variations
  'dotnet': '.NET',
  'dot net': '.NET',
  '.net': '.NET',
  'asp.net': 'ASP.NET Core',
  'aspnet': 'ASP.NET Core',

  // CI/CD variations
  'continuous integration': 'CI/CD',
  'continuous deployment': 'CI/CD',
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',

  // Machine Learning variations
  'ml': 'Machine Learning',
  'machine learning': 'Machine Learning',

  // Artificial Intelligence variations
  'ai': 'AI',
  'artificial intelligence': 'AI',

  // Frontend variations
  'front-end': 'Frontend',
  'front end': 'Frontend',
  'frontend': 'Frontend',

  // Backend variations
  'back-end': 'Backend',
  'back end': 'Backend',
  'backend': 'Backend',

  // Full Stack variations
  'fullstack': 'Full Stack',
  'full-stack': 'Full Stack',
  'full stack': 'Full Stack',

  // Git variations
  'git': 'Git',
  'github': 'GitHub',
  'gitlab': 'GitLab',

  // Docker variations
  'docker': 'Docker',
  'containers': 'Docker',

  // SQL variations
  'sql': 'SQL',
  'mysql': 'MySQL',
  'mssql': 'SQL',
  'sql server': 'SQL',

  // GraphQL variations
  'graphql': 'GraphQL',
  'graph ql': 'GraphQL',

  // REST API variations
  'rest': 'REST',
  'rest api': 'REST',
  'restful': 'REST',
  'restful api': 'REST',

  // Redux variations
  'redux': 'Redux',
  'redux toolkit': 'Redux',

  // TensorFlow variations
  'tensorflow': 'TensorFlow',
  'tf': 'TensorFlow',

  // PyTorch variations
  'pytorch': 'PyTorch',
  'torch': 'PyTorch',

  // C++ variations
  'c++': 'C++',
  'cpp': 'C++',
  'cplusplus': 'C++',

  // C# variations
  'c#': 'C#',
  'csharp': 'C#',
  'c sharp': 'C#',

  // Spring Boot variations
  'springboot': 'Spring Boot',
  'spring boot': 'Spring Boot',

  // Next.js variations
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'next js': 'Next.js',

  // Svelte variations
  'sveltejs': 'Svelte',
  'svelte.js': 'Svelte',

  // Tailwind variations
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
}

// Normalize a skill string to its canonical form
export function normalizeSkill(skill: string): string {
  const normalized = skill.toLowerCase().trim()
  return SKILL_SYNONYMS[normalized] || skill
}
