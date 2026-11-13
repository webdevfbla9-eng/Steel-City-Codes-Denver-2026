import pythonIcon from '../assets/icons/python.svg';
import javaIcon from '../assets/icons/java.svg';
import raspberryPiIcon from '../assets/icons/raspberrypi.svg';
import htmlIcon from '../assets/icons/html5.svg';
import cssIcon from '../assets/icons/css3.svg';

const python = { src: pythonIcon, alt: 'Python' };
const java = { src: javaIcon, alt: 'Java' };

export const courses = {
  introPython: {
    title: 'Intro to Python',
    icons: [python],
    text: 'This introductory course will cover all of the fundamentals of coding including input/output, loops, logical operations, and more using the very user-friendly Python language!',
    levelLabel: 'Recommended Math Grade Level',
    level: '4+',
    badge: 'Grade 4+',
  },
  introJava: {
    title: 'Intro to Java',
    icons: [java],
    text: 'This introductory level course will cover all of the fundamentals of coding while diving a little bit more deeply into the logic of programming than Intro to Python might.',
    levelLabel: 'Recommended Math Grade Level',
    level: '5+',
    badge: 'Grade 5+',
  },
  intermediatePython: {
    title: 'Intermediate Python',
    icons: [python],
    text: 'This course will cover more material and move at a faster pace than the Intro to Python course.',
    levelLabel: 'Recommended Math Grade Level',
    level: '5+ OR Have Taken Intro to Python',
    badge: 'Grade 5+',
  },
  intermediateJava: {
    title: 'Intermediate Java',
    icons: [java],
    text: 'This course will cover more material and move at a faster pace than the Intro to Java course.',
    levelLabel: 'Recommended Math Grade Level',
    level: '6+ OR Have Taken Intro to Java',
    badge: 'Grade 6+',
  },
  microcontrollers: {
    title: 'Introduction to Microcontrollers',
    icons: [{ src: raspberryPiIcon, alt: 'Raspberry Pi' }],
    text: 'This class will be an investigation into the world of embedded systems programming. We will be using a Raspberry Pi Pico (similar to an Arduino) and students will work on both class and self guided projects.',
    levelLabel: 'REQUIRED Grade Level and Knowledge',
    level:
      'The Introduction to Microcontrollers class is only offered to rising (future!) 7th, 8th, and 9th graders. All prospective students must have at least an intermediate level of Python knowledge.',
    badge: 'Rising 7th–9th',
    required: true,
  },
  webDevelopment: {
    title: 'Web Development',
    icons: [
      { src: htmlIcon, alt: 'HTML' },
      { src: cssIcon, alt: 'CSS' },
    ],
    text: 'This is an introductory course to web development. It will mainly focus on HTML and CSS programming. This class will only be offered during the second session and not the first.',
    levelLabel: 'Recommended Math Grade Level',
    level: '6+',
    badge: 'Grade 6+',
  },
};

export const courseList = [
  courses.introPython,
  courses.introJava,
  courses.intermediatePython,
  courses.intermediateJava,
  courses.microcontrollers,
  courses.webDevelopment,
];

export const learningPaths = [
  {
    name: 'Python Path',
    icon: python,
    steps: [courses.introPython, courses.intermediatePython, courses.microcontrollers],
  },
  {
    name: 'Java Path',
    icon: java,
    steps: [courses.introJava, courses.intermediateJava],
  },
  {
    name: 'Web Path',
    icon: courses.webDevelopment.icons[0],
    steps: [courses.webDevelopment],
  },
];
