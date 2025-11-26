import JobRole from '../models/JobRole';

const defaults = [
  {
    title: 'Frontend Developer',
    description: 'Build responsive and interactive user interfaces using modern frameworks and best practices.',
    category: 'Engineering',
    requirements: ['3+ years experience with React/Vue/Angular', 'Strong HTML, CSS, JavaScript skills', 'Experience with state management', 'Knowledge of web accessibility'],
    skills: ['React', 'TypeScript', 'CSS', 'JavaScript', 'Responsive Design'],
    icon: '💻'
  },
  {
    title: 'Backend Developer',
    description: 'Design and implement scalable server-side applications and APIs.',
    category: 'Engineering',
    requirements: ['3+ years backend development experience', 'Proficiency in Node.js/Python/Java', 'Database design expertise', 'RESTful API development'],
    skills: ['Node.js', 'Python', 'SQL', 'APIs', 'System Design'],
    icon: '⚙️'
  },
  {
    title: 'Full Stack Developer',
    description: 'Work on both frontend and backend to deliver complete solutions.',
    category: 'Engineering',
    requirements: ['Experience with full stack development', 'Frontend and backend proficiency', 'Database management', 'DevOps knowledge'],
    skills: ['React', 'Node.js', 'Databases', 'APIs', 'Cloud Services'],
    icon: '🚀'
  },
  {
    title: 'DevOps Engineer',
    description: 'Build and maintain CI/CD pipelines and infrastructure automation.',
    category: 'Engineering',
    requirements: ['Experience with CI/CD tools', 'Cloud platform expertise (AWS/Azure/GCP)', 'Container orchestration', 'Infrastructure as Code'],
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Jenkins'],
    icon: '🔧'
  },
  {
    title: 'Product Manager',
    description: 'Define product strategy and work with cross-functional teams to deliver value.',
    category: 'Product',
    requirements: ['3+ years product management experience', 'Strong analytical skills', 'Excellent communication', 'User research experience'],
    skills: ['Product Strategy', 'Roadmapping', 'User Research', 'Data Analysis', 'Stakeholder Management'],
    icon: '📊'
  },
  {
    title: 'UX/UI Designer',
    description: 'Create intuitive and beautiful user experiences through research and design.',
    category: 'Design',
    requirements: ['Portfolio demonstrating UX/UI work', 'Proficiency in design tools', 'User research experience', 'Understanding of design systems'],
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Interaction Design'],
    icon: '🎨'
  }
];

export const seedJobRoles = async () => {
  const count = await JobRole.count();
  if (count === 0) {
    console.log('Seeding job roles...');
    await JobRole.insertMany(defaults);
  }
};
