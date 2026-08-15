/*
# TECH — Development Seed Data

## Summary
Creates test hackathons for development. Student profiles, skills, and other data
are created by actual users through the signup/onboarding flow.

## Seed Content
- 6 hackathons across different categories (AI/ML, Web, IoT, Blockchain, Security, Data)
- Various deadlines, team sizes, and required skills
*/

INSERT INTO hackathons (name, platform, url, category, description, registration_deadline, start_date, end_date, max_team_size, required_skills, status) VALUES
(
  'Smart India Hackathon 2026',
  'SIH',
  'https://sih.gov.in',
  'AI/ML',
  'National-level hackathon where students solve real-world problem statements posed by government and industry. 36-hour innovation challenge across multiple themes.',
  '2026-09-30',
  '2026-10-15',
  '2026-10-16',
  4,
  ARRAY['Python', 'AI/ML', 'React', 'Node.js'],
  'open'
),
(
  'TechFest CodeArena',
  'TechFest',
  'https://techfest.org/codearena',
  'Web',
  'Premier coding hackathon at IIT Bombay. Build innovative web applications in 24 hours. Themes include sustainability, education, and healthcare.',
  '2026-12-01',
  '2026-12-20',
  '2026-12-22',
  5,
  ARRAY['JavaScript', 'React', 'Node.js', 'HTML/CSS'],
  'open'
),
(
  'IoT Innovation Challenge',
  'InnovateIndia',
  'https://innovateindia.gov.in/iot',
  'IoT',
  'Build IoT solutions for smart cities. Teams must design and prototype connected devices that solve urban challenges.',
  '2026-08-25',
  '2026-09-10',
  '2026-09-12',
  4,
  ARRAY['IoT', 'Python', 'Cloud', 'C++'],
  'open'
),
(
  'Blockchain Buildathon',
  'DevPost',
  'https://devpost.com/blockchain2026',
  'Web3',
  '48-hour blockchain development competition. Build decentralized applications, smart contracts, and Web3 solutions.',
  '2026-11-15',
  '2026-12-05',
  '2026-12-07',
  3,
  ARRAY['Blockchain', 'JavaScript', 'Cloud'],
  'open'
),
(
  'CyberSec CTF',
  'CTFtime',
  'https://ctftime.org/event/2026',
  'Security',
  'Capture The Flag competition focused on cybersecurity challenges including cryptography, web exploitation, and forensics.',
  '2026-10-10',
  '2026-10-25',
  '2026-10-26',
  4,
  ARRAY['Cybersecurity', 'Python', 'C++'],
  'open'
),
(
  'Data Science Derby',
  'Kaggle',
  'https://kaggle.com/derby2026',
  'Data',
  '24-hour data science competition. Analyze large datasets, build ML models, and present insights to a panel of judges.',
  '2026-09-05',
  '2026-09-20',
  '2026-09-21',
  4,
  ARRAY['Python', 'Data Science', 'AI/ML'],
  'open'
)
ON CONFLICT DO NOTHING;
