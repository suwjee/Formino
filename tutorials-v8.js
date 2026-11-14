/* Sources reviewed for the movements used by the fixed 24-week curriculum. */
(function(root){
'use strict';
const nasm='https://www.nasm.org/resource-center/exercise-library/';
const ace='https://www.acefitness.org/resources/everyone/exercise-library/';
const cuh='https://www.cuh.nhs.uk/patient-information/cardiac-rehabilitation-home-exercise-guidelines/';
const sussex='https://www.uhsussex.nhs.uk/resources/standing-exercises-2/';
const gymkc='https://gymkc.org/en/exercise/';
const boxing='https://www.honourandglory.co.uk/focus-of-the-month/shadowboxing';
const marchNote='در بخش Marching حرکت پایه را ببین. در فرمینو ریتم و ارتفاع قدم طبق هدف مرحله تنظیم می‌شود.';
const tutorial=(name,url,match='exact',note='')=>({name,url,match,note});
const records={};
function add(ids,name,url,match,note,video){
 for(const id of ids.split(' '))records[id]={source:tutorial(name,url,match,note),video,status:match||'exact',verifiedAt:'2026-11-13'};
}

add('PU-V2','NASM · Push-Up',nasm+'push-up','exact','',tutorial('NASM','https://www.youtube.com/watch?v=WDIpL0pjun0'));
add('PU-V3','NASM · Push-Up',nasm+'push-up','base','نسخهٔ برنامه یک مکث پایین دارد. مدت مکث و فرم در راهنمای داخل اپ آمده است.',tutorial('NASM','https://www.youtube.com/watch?v=WDIpL0pjun0','base'));
add('ROW-V0 ROW-V2','Gravitus · One-Arm Dumbbell Row','https://gravitus.com/guides/exercises/one-arm-dumbbell-row/','base','مرجع تکیه بر نیمکت دارد. در فرمینو دست آزاد روی ران تکیه دارد و ROW-V2 مکث بالا دارد.');
add('SQ-V2','NASM · Goblet Squat',nasm+'goblet-squat','exact','',tutorial('NASM','https://www.youtube.com/watch?v=nfX7IFK9UNI','base','ویدئو کتل‌بل را نشان می‌دهد. روش گرفتن یک دمبل در راهنمای داخل اپ آمده است.'));
add('RDL-V1','NASM · Romanian Deadlift',nasm+'dumbbell-romanian-deadlift','base','مرجع دو دمبل نشان می‌دهد. در فرمینو یک دمبل با دو دست در مرکز بدن گرفته می‌شود.');
add('legacy:lateralRaise','GymEd · Band Lateral Raise','https://gymed.com.au/exercises/band-lateral-raise.html','base','راهنما از کش دسته‌دار استفاده می‌کند. کش تخت در فرمینو با گرفتن ایمن طبق راهنمای داخلی استفاده می‌شود.');
add('BAND-V0','Disability Sport NI · Band Pull-Apart','https://www.dsni.co.uk/wp-content/uploads/2022/08/Disability-Sport-NI-Stay-Active-Resource-Card-Band-Blast.pdf','base','بخش Band Pull Apart را ببین. دامنهٔ فرمینو را با کش تخت سبک تنظیم کن.');
add('BC-V0','Muscle & Strength · One-Arm Curl','https://www.muscleandstrength.com/exercises/one-arm-standing-dumbbell-curl.html');
add('CR-V1','GYMKC · Crunch (arms on chest)',gymkc+'crunch-arms-on-chest/');
add('DB-V0','NASM · Dead Bug',nasm+'dead-bug','base','در فرمینو دست‌ها ثابت می‌مانند و فقط پاشنهٔ پای خم‌شده پایین می‌آید.');
add('FP-V0','GYMKC · Single-Arm Floor Press',gymkc+'dumbbell-single-arm-floor-press/');
add('SS-V1','Physitrack · Split Squat with Support','https://uk.physitrack.com/home-exercise-video/split-squat-with-support','base','الگوی حرکت ثابت است. برای تعادل در فرمینو کنار دیوار بایست و پاها روی زمین بمانند.');
add('legacy:bandRow','Healthline · Seated Resistance Band Row','https://www.healthline.com/health/resistance-band-row-exercise','exact','در توضیح مرجع فقط مسیر مهار دور کف پا را اجرا کن. اتصال به اثاث یا در در فرمینو مجاز نیست.');
add('OHP-V0','Horton Barbell · Half-Kneeling Press','https://hortonbarbell.com/kneeling-single-arm-dumbbell-press/');
add('HW-V1','Physitrack · Hamstring Walkout','https://us.physitrack.com/home-exercise-video/hamstring-walkout','base','فرمینو از گام‌های کوتاه‌تر استفاده می‌کند. تعداد گام هر تکرار را از راهنمای داخل اپ بخوان.');
add('TRI-V0','Critical Body · Single-Arm Lying Triceps Extension','https://criticalbody.com/one-arm-lying-tricep-extension/','base','مرجع نیمکت نشان می‌دهد. نسخهٔ فرمینو روی زمین و با یک دمبل کنار سر اجرا می‌شود.');
add('CALF-V1','University Hospitals Sussex · Heel Raises',sussex,'base','الگوی بالاآمدن پاشنه را ببین. فرمینو روی یک پا، روی زمین و با تکیهٔ سبک به دیوار اجرا می‌شود.');
add('RC-V1','ACE · Reverse Crunch',ace+'76/reverse-crunch/');
add('SP-V0','CIRIUS · Side Plank on Knees','https://research.cirius.or.kr/en/rehabilitation/side-plank-progression-oblique-core-home','base','در صفحه مرحلهٔ زانوی خم را انتخاب کن. زمان برنامه برای هر سمت جداست.');
add('RL-V1','ACE · Reverse Lunge',ace+'319/reverse-lunge/','base','در فرمینو دست آزاد برای حفظ تعادل دیوار را لمس می‌کند.');
add('GB-V1','PureGym · Dumbbell Glute Bridge','https://www.puregym.com/exercises/glutes/glute-bridge/dumbbell-glute-bridges/');
add('LAT-V1','Physitrack · Bent-Arm Lateral Raise','https://na.physitrack.com/home-exercise-video/resisted-lateral-raise-with-bent-arms','base','مرجع هم‌زمان دو دست را نشان می‌دهد. در فرمینو یک دمبل و یک دست استفاده می‌شود.');
add('legacy:bandCurl','Disability Sport NI · Band Blast','https://www.dsni.co.uk/wp-content/uploads/2022/08/Disability-Sport-NI-Stay-Active-Resource-Card-Band-Blast.pdf','base','مرجع هر دست را جدا نشان می‌دهد. در فرمینو هر دو دست هم‌زمان و مرکز کش تخت زیر پا مهار می‌شود.');
add('CALF-V0','University Hospitals Sussex · Heel Raises',sussex,'base','مرجع با تکیه اجرا می‌شود. در فرمینو پاشنه از سطح زمین بالا می‌آید و برای تعادل می‌توان دیوار را سبک لمس کرد.');
add('CR-V2','Muscle & Fitness · Weighted Crunch','https://www.muscleandfitness.com/exercise/workouts/abs-and-core-exercises/weighted-crunch/','base','مرجع با وزنهٔ صفحه‌ای اجرا می‌کند. در فرمینو دمبل بسته با دو دست نزدیک سینه نگه داشته می‌شود.');
add('PULL-V0','Handstand Quest · Feet Supported Pull-Ups','https://catalog.handstandquest.com/exercises/feet_supported_pullups','base','مرجع حرکت کششی پویا نشان می‌دهد. در فرمینو فقط موقعیت آویز با پا روی زمین و نگه‌داری ایستا اجرا می‌شود.');
add('PULL-V1','GymDaze · Active Hang','https://gym-daze.com/exercises/active-hang');
add('PULL-V2','Training for Climbing · Scapular Pull-up','https://trainingforclimbing.com/video-the-best-climbing-exercise-youre-not-doing/');
add('PULL-V3','NASM · Pull-Up',nasm+'pull-up','exact','',tutorial('NASM','https://www.youtube.com/watch?v=9yVGh3XbJ34'));

add('stage:easy-march stage:slow-march stage:progressive-march stage:brisk-march stage:march-arm-swing',
 'Cambridge University Hospitals · Marching',cuh,'base',marchNote);
add('stage:ankle-shoulder-mobility','Cambridge University Hospitals · Warm-up Mobility',cuh,'base','بخش‌های Ankle Activators و حرکت شانه را ببین. حرکت‌ها در فرمینو در دامنهٔ راحت انجام می‌شوند.');
add('stage:wall-scapular-push-up','Physitrack · Press-up Plus','https://us.physitrack.com/home-exercise-video/press-up-plus','base','منبع روی زمین است. فرمینو در حالت ایستاده کنار دیوار و با آرنج ثابت و صاف اجرا می‌شود.');
add('stage:easy-squat','University Hospitals Sussex · Standing Exercises',sussex,'base','نسخهٔ گرم‌کردن فرمینو اسکوات بدون وزنه با دامنه و سرعت کنترل‌شده است.');
add('stage:hip-hinge-drill','Notbroken · Hip Hinge Technique','https://www.notbroken.io/videos/hip-hinge-for-beginners/','base','در فرمینو الگو با دست خالی و بدون نیاز به چوب تمرین می‌شود.');
add('stage:easy-push-up','ACE · Bent-Knee Push-Up',ace+'13/bent-knee-push-up/','base','ACE نسخهٔ زانو را توضیح می‌دهد. برای نسخهٔ دیواری از کارت «شنای سوئدی روی دیوار» در اپ استفاده کن.');
add('stage:side-step','Cambridge University Hospitals · Toe Taps to the Side',cuh,'base','حرکت مرجع ضربهٔ پنجه به کنار است. فرمینو با گام کوچک جانبی و نزدیک‌کردن پای دیگر اجرا می‌شود.');
add('stage:standing-breathing','NHS · Breathing Exercises','https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/','base','تنفس آرام ایستاده را در دامنهٔ طبیعی تمرین کن. زمان‌بندی داخل جلسه اولویت دارد.');
add('stage:shallow-split-squat','Physitrack · Split Squat with Support','https://uk.physitrack.com/home-exercise-video/split-squat-with-support','base','در گرم‌کردن از دامنهٔ کوتاه و تکیهٔ سبک به دیوار استفاده کن.');
add('stage:easy-glute-bridge','NASM · Floor Bridge',nasm+'floor-bridge','exact','',tutorial('NASM','https://www.youtube.com/watch?v=Z3cY3d3BBo4'));
add('stage:unloaded-floor-press','GYMKC · Single-Arm Floor Press',gymkc+'dumbbell-single-arm-floor-press/','base','دمبلِ منبع را حذف کن و مسیر حرکت را با دست خالی تمرین کن.');
add('stage:shadow-boxing stage:brisk-shadow-boxing','Honour & Glory Boxing · Shadowboxing',boxing,'base','فرمینو مشت کوتاه و کنترل‌شده با دست خالی و بدون پرش تجویز می‌کند.');
add('stage:reverse-step','ACE · Reverse Lunge',ace+'319/reverse-lunge/','base','در فرمینو فقط گام کوتاه رو به عقب کنار دیوار تمرین می‌شود.');
add('stage:step-jack','A Human Web · Step Jack','https://www.ahumanweb.com/moves/step-jack');
add('stage:jumping-jack','NASM · Jumping Jacks',nasm+'jumping-jacks','exact','پرش فقط در صورت احراز شرایط اجرای نسخهٔ پرشی مجاز است.',
 tutorial('NASM','https://www.youtube.com/watch?v=uLVt6u15L98'));
add('stage:low-impact-climber','Physia · Low-intensity Mountain Climber','https://procaryote.com/en/exercises/core/low-intensity-mountain-climber/','base','الگوی گامی را ببین. مدت و ریتم تناوب هوازی را از جلسهٔ فرمینو بخوان.');

root.FORMINO_TUTORIALS=Object.freeze(records);
if(typeof module!=='undefined'&&module.exports)module.exports=records;
})(typeof window!=='undefined'?window:globalThis);
