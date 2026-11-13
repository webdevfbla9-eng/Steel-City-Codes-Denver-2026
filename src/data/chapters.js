import smokyHill from '../assets/chapters/smoky-hill.jpg';
import koelbel from '../assets/chapters/koelbel.jpg';
import castlewood from '../assets/chapters/castlewood.jpg';
import cherryCreekAcademy from '../assets/chapters/cherry-creek-academy.jpg';

export const chapters = [
  {
    name: 'Smoky Hill Library',
    photo: smokyHill,
    alt: 'The front of Smoky Hill Library',
    schedule: 'Saturdays, 3:00–4:00 PM',
    course: 'Intro to Python',
    location: 'Study room varies weekly (details shared by chapter head)',
    heads: [{ name: 'Kelly Chang', email: 'kwchang1616@gmail.com' }],
  },
  {
    name: 'Koelbel Library',
    photo: koelbel,
    alt: 'The entrance to Koelbel Library',
    schedule: 'Saturdays, 3:00–5:00 PM',
    course: 'Intro to Java',
    location: 'Forum Theater — location subject to changes',
    heads: [
      { name: 'Tuka Bayasgalan', email: 'ariuntuya.lotus@gmail.com' },
      { name: 'Estella Li', email: 'eli3@cherrycreekschools.org' },
    ],
  },
  {
    name: 'Castlewood Library',
    photo: castlewood,
    alt: 'Castlewood Library from the parking lot',
    schedule: 'Saturdays, 4:00–5:00 PM',
    course: 'Intro to Java',
    location: 'Meeting Room A',
    heads: [
      { name: 'Aarnav Reddy', email: 'areddy@cherrycreekschools.org' },
      { name: 'Trisha Kuriyal', email: 'trishakuriyal@gmail.com' },
    ],
  },
  {
    name: 'Cherry Creek Academy',
    photo: cherryCreekAcademy,
    alt: 'The front of Cherry Creek Academy',
    schedule: 'Tuesdays, 3:30–4:45 PM',
    course: 'Intro to Java',
    heads: [
      { name: 'Aryan Gupta', email: 'gupta9aryan@gmail.com' },
      { name: 'Lucy Chen', email: 'yuzechen2010@gmail.com' },
    ],
  },
];
