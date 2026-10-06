const venture=(id,name,short,color,role,status,scores,bottleneck,next,projects,rationale)=>({id,name,short,color,role,status,scores,bottleneck,next,projects,rationale});
export const ventures=[
 venture('tranq','Tranquilitas','Tranquilitas','#78dfc3','Cash engine','focus',{impact:10,importance:10,urgency:8,fit:10,attention:9,mental:9},'Several growth fronts compete with the daily operation.','Choose one partnership offer and one booking improvement.', ['Operations','Direct booking','Partnerships','Caribbean expansion'],'Existing revenue, a working service, and room to grow. Improve the operation before opening more fronts.'),
 venture('ai','Bahamas AI Solutions','Bahamas AI','#a795f4','Build from proof','focus',{impact:8,importance:9,urgency:6,fit:9,attention:6,mental:6},'The work needs a clear offer and proof a buyer can inspect.','Package one finished build into a clear paid offer.', ['Our Work','Offers','Delivery'],'Your existing builds create credible proof. A focused offer can turn that work into repeatable sales.'),
 venture('bmc','Bahamas Mineral Company','BMC','#e9b879','Prove the product','maintain',{impact:9,importance:7,urgency:6,fit:9,attention:7,mental:7},'Product validation and production readiness come before wider applications.','Define the poultry-calcium pilot and its evidence requirements.', ['Poultry calcium','Facility','Funding'],'High potential, with a longer path to revenue. Fund attention by milestone instead of by excitement.'),
 venture('water','Open Water Bahamas','Open Water','#6ebbea','Tourism revenue','maintain',{impact:7,importance:7,urgency:5,fit:8,attention:5,mental:4},'Distribution and reliable content delivery need a repeatable process.','Clarify the shoot workflow and who owns delivery.', ['Clear kayak','Distribution'],'A working tourism offer shares customers and relationships with Tranquilitas.'),
 venture('toast','Toastmasters & District 47','Toastmasters','#de91b5','Leadership & network','delegate',{impact:6,importance:6,urgency:7,fit:7,attention:8,mental:7},'Many small obligations can become a second job.','Assign owners to routine meeting preparation.', ['Club 1600','District website','SAA finances'],'Network and leadership matter. Protect them with a bounded time commitment and clear owners.'),
 venture('tissue','Tissue Venture','Tissue venture','#bead86','Validate demand','park',{impact:7,importance:4,urgency:3,fit:6,attention:3,mental:4},'No verified demand, landed costs, or first order yet.','Test hospitality demand before committing to stock.', ['Customer discovery','Manufacturing'],'An option worth testing. Keep inventory decisions behind real orders and credible landed costs.'),
 venture('lab','Idea Lab','Idea Lab','#939bb4','Keep the options','park',{impact:5,importance:2,urgency:2,fit:5,attention:4,mental:5},'New possibilities compete with unfinished commitments.','Give each idea one proof test before it earns a project.', ['Prefab housing','StreetSweeper','Other concepts'],'Ideas stay visible without claiming today’s attention. Promote one only when evidence justifies it.')
];
const task=(id,ventureId,title,project,impact,minutes,extra={})=>({id,ventureId,title,project,impact,minutes,status:'open',due:'',note:'Seeded from shared context; check whether this is still open.',createdAt:'2026-10-06',...extra});
export const tasks=[
 task('t1','tranq','Finish the Graycliff partnership offer','Partnerships',10,90),
 task('t2','tranq','Verify the guest booking and payment journey','Direct booking',9,45),
 task('t3','tranq','Set a clear handoff for bookings and therapist scheduling','Operations',9,45),
 task('t4','tranq','Improve GBP services, posts, and tracking','Direct booking',8,45),
 task('t5','tranq','Finish Cayman site and booking setup','Caribbean expansion',7,90),
 task('t6','tranq','Review the WhatsApp receptionist workflow','Operations',8,60),
 task('t7','tranq','Follow up with the ILTM operator shortlist','Partnerships',8,20),
 task('t8','tranq','Reconcile the weekly collections and payouts','Operations',8,45),
 task('t9','tranq','Prepare Doctors Hospital wellness delivery','Operations',7,30,{due:'2026-10-22'}),
 task('a1','ai','Curate clickable examples for Our Work','Our Work',9,45),
 task('a2','ai','Define one build offer with starting price and add-ons','Offers',9,45),
 task('a3','ai','Document a repeatable build and handoff checklist','Delivery',8,60),
 task('b1','bmc','Define the first poultry-calcium pilot','Poultry calcium',9,60),
 task('b2','bmc','Confirm lab testing scope and quote','Poultry calcium',9,30),
 task('b3','bmc','Sequence the facility works and budget','Facility',8,45),
 task('b4','bmc','Verify live grant deadlines and submission requirements','Funding',7,30),
 task('w1','water','Confirm the drone operator and shoot workflow','Clear kayak',8,30),
 task('w2','water','Clarify guest deliverables and turnaround','Clear kayak',8,20),
 task('w3','water','Test a cross-sell through existing spa relationships','Distribution',7,30),
 task('s1','toast','Finish the District 47 photo and leader pass','District website',7,90),
 task('s2','toast','Prepare the next Club 1600 meeting checklist','Club 1600',7,20,{due:'2026-10-08'}),
 task('s3','toast','Update SAA receipts and receivables','SAA finances',7,30),
 task('s4','toast','Assign routine meeting preparation to named owners','Club 1600',8,20),
 task('p1','tissue','Speak to hospitality buyers about recurring supply','Customer discovery',8,30,{status:'parked'}),
 task('p2','tissue','Compare manufacturer MOQ and landed unit cost','Manufacturing',7,60,{status:'parked'}),
 task('l1','lab','Check prefab housing assumptions before a factory visit','Prefab housing',6,60,{status:'parked'}),
 task('l2','lab','Review StreetSweeper’s next practical milestone','StreetSweeper',5,30,{status:'parked'})
];
export const makeSeed=()=>({version:1,ventures:structuredClone(ventures),tasks:structuredClone(tasks),hours:4});
