const slides = (id) => ({
  embedUrl: `https://docs.google.com/presentation/d/e/${id}/pubembed?start=false&loop=false&delayms=15000`,
  openUrl: `https://docs.google.com/presentation/d/e/${id}/pub?start=false&loop=false&delayms=15000`,
});

export const curriculum = [
  {
    title: 'Intro to Python',
    level: 'Beginner',
    ...slides('2PACX-1vRbWSb0ncxzcZ6CgF7IUqkCXbH6OIm2CvnSzBdKpX34G7rbKjsaQ-u7psJdpIJOlK4Irq7_k8E39Qu8'),
  },
  {
    title: 'Intermediate Python',
    level: 'Intermediate',
    ...slides('2PACX-1vT30kLqrQzWlejyyxyAUoiBEB0Xrtef41839mIOKv06imxyE1dPk3gfs7PYUqrpOzDsSFqIApHWvthb'),
  },
  {
    title: 'Intro to Java',
    level: 'Beginner',
    ...slides('2PACX-1vRdjwj0zcbbAsZcb_GjeRcyw2Msl0MUyc98QBkoesAbFnhpc1LcpnZHw-fOX-zcu4SXSKmNOta7fWVO'),
  },
  {
    title: 'Intermediate Java',
    level: 'Intermediate',
    ...slides('2PACX-1vSOan7O5OPF9boT2y_P7JUkdR1gFK7IT5fAhSV1oNz2s7uGwx-Bh_yM90VTGCv3J5fg7QrCiWHEBrgS'),
  },
  {
    title: 'Website Development',
    level: 'Project-based',
    ...slides('2PACX-1vRJ4yFvd3vPEW5uMeHKE4C70oGslxgxxY8uOFQDUqRfcHWVqzQOsfCal1mOQm57dVqffkhIk1A4a88z'),
  },
];

const googleForm = (id) => ({
  embedUrl: `https://docs.google.com/forms/d/e/${id}/viewform?embedded=true`,
  openUrl: `https://docs.google.com/forms/d/e/${id}/viewform`,
});

export const parentForms = [
  {
    title: 'School Year Chapter Registration Form',
    description: 'Sign up your student to learn coding at a nearby library or even just their own school!',
    ...googleForm('1FAIpQLSeA45Iy4qB8I41lWD9dy7KI2ERqi6yZ9JxVf6eYRx-g1CryoA'),
  },
  {
    title: 'Summer Camp Registration Form',
    description:
      'Summer camp provides longer study periods for students. This ensures a strong understanding of coding. We also host coding competitions as well as scavenger hunts!',
    ...googleForm('1FAIpQLSfpG4iir1rkFSnnCpNuhQiU3gsgd7mQZZis6AyUPJ_QRUJ2PA'),
  },
];

export const forms = [
  {
    title: 'School Year Chapters Volunteer Form',
    description: 'Teach at one of our weekly school year chapters.',
    embedUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLScnFfn7h0eWN-JlQPpnB7BAeaHwunvp7AtUVA-WXLiVeK61tA/viewform?embedded=true',
    openUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLScnFfn7h0eWN-JlQPpnB7BAeaHwunvp7AtUVA-WXLiVeK61tA/viewform',
  },
  {
    title: 'Chapter Leader / Starting a Chapter Form',
    description: 'Lead an existing chapter or bring Steel City Codes to a new location.',
    embedUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLSdflcbVore_mRgbPzeK-0wPoYXER8StzIEjzPQmQUSGIjKsuQ/viewform?embedded=true',
    openUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLSdflcbVore_mRgbPzeK-0wPoYXER8StzIEjzPQmQUSGIjKsuQ/viewform',
  },
];
