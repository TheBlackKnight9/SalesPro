const fs = require('fs');
const content = fs.readFileSync('c:/Internship/setu CRM/frontend/src/app/dashboard/leads/[id]/page.tsx', 'utf8');

const openDivs = (content.match(/<div/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;
const openButtons = (content.match(/<button/g) || []).length;
const closeButtons = (content.match(/<\/button>/g) || []).length;
const openAnimate = (content.match(/<AnimatePresence/g) || []).length;
const closeAnimate = (content.match(/<\/AnimatePresence>/g) || []).length;
const openMotion = (content.match(/<motion.div/g) || []).length;
const closeMotion = (content.match(/<\/motion.div>/g) || []).length;

console.log(`DIVs: Open=${openDivs}, Close=${closeDivs}`);
console.log(`BUTTONs: Open=${openButtons}, Close=${closeButtons}`);
console.log(`ANIMATE: Open=${openAnimate}, Close=${closeAnimate}`);
console.log(`MOTION: Open=${openMotion}, Close=${closeMotion}`);
