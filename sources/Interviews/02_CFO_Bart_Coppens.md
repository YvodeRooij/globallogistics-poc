# Discovery Interview — CFO (Bart Coppens), GlobalLogistics

**Project:** Project GlobalLogistics — GenAI Strategic Transformation (Discovery)
**Date:** Thursday, 13 November 2025
**Duration:** ~34 min
**Location:** Teams call
**Participants:** Bart Coppens, CFO (GlobalLogistics B.V.) · Daan Veldkamp, Engagement Manager (WAIMAKERS)

_Recorded & transcribed via Maia. Auto-generated transcript — lightly cleaned for readability._

---

**Maia auto-tags:** margin-per-declaration · hours-based-model · data-fragmentation · MIS-reconciliation · ROI-business-case · customs-fines

---

[00:00] **Daan Veldkamp:** Thanks for making the time, Bart. You spoke to Alex already, I think?

[00:07] **Bart Coppens:** Yeah, one sec — okay, closed Outlook. Alex gave you the vision Monday, I assume. So you want me for the numbers.

[00:16] **Daan Veldkamp:** Exactly, the P&L reality. Start at the top — how does the business make money?

[00:24] **Bart Coppens:** Highest level, we did 41.8 million in revenue in 2024. We file customs declarations, that's the product — roughly 512,000 of them last year across the three offices, Rotterdam, Antwerp, Duisburg. Simple division gets you about 78 euro per declaration. Blended fee.

[00:46] **Daan Veldkamp:** 78 euro average.

[00:48] **Bart Coppens:** Blended — and that's the first thing I'd push back on, because the average is honestly a bit of a lie. The spread is enormous. Some clients pay 40 a declaration, high-volume, standardized. Others pay 130, 140 because it's complex — lots of line items, exotic HS codes. So "78 euro" tells you almost nothing about whether a given client is actually profitable. The mix is everything.

[01:14] **Daan Veldkamp:** Can you see per-client profitability today?

[01:17] **Bart Coppens:** Not as cleanly as I'd want — that's my whole headache, we'll get there. But economics first. What keeps me up isn't the top line, it's margin per declaration. It's falling — three, three and a half, sometimes four percent a year, year over year. Relentless.

[01:35] **Daan Veldkamp:** What's driving the compression?

[01:38] **Bart Coppens:** Price pressure. The market's commoditizing. There's a player, DeclareNow — came in aggressive, low price, very platform-y, and they've reset what clients think a declaration should cost. Between us, I don't think they're cheaper to run, I think they're buying share. Doesn't matter. My clients see their number and at renewal they want ten, fifteen percent off. Every time.

[02:02] **Daan Veldkamp:** And you can't pass that through on cost.

[02:05] **Bart Coppens:** No, because here's the trap. Roughly 70 percent of our cost is people — 350 FTE, mostly declarants. And declarant salaries go up, not down. There's a real talent shortage, Morgan can tell you all about it. My biggest cost line is rising while my price per unit falls. You don't need an MBA to see where that ends.

[02:28] **Daan Veldkamp:** Right.

[02:29] **Bart Coppens:** And this is the actual strategic problem. The only way I grow revenue is by adding declarants — more volume needs more hands. When Alex says "grow 20 percent," what he's really saying is "hire 20 percent more declarants." Cost grows in lockstep with revenue. I scale the top line, margin just sits there or shrinks. The scalability trap. We can't grow our way out, because growth costs the same as it earns.

[02:57] **Daan Veldkamp:** No operating leverage.

[02:59] **Bart Coppens:** None. Every euro of new revenue drags a euro of new cost behind it. That's what AI has to break. I don't need a chatbot. I need cost-to-serve per declaration to come down structurally — so the next 100,000 declarations don't need another 60 people.

[03:18] **Daan Veldkamp:** You said per-client profitability isn't clean. Can we go there?

[03:23] **Bart Coppens:** [sigh] Yeah, my biggest frustration. The data is a mess, literally. We run three different operational systems — three, because we grew by acquisition and never integrated. Rotterdam, the main hub, runs a legacy system called DUANE 4 — old, works, but getting data out is like pulling teeth. And Rotterdam also has AGS and Idep export feeds bolted on for the export side and statistical reporting. So even one office isn't one clean thing.

[03:52] **Daan Veldkamp:** Okay.

[03:53] **Bart Coppens:** Antwerp, the Belgian office, is completely separate — PLDA and NCTS, the transit side. Different system, different codes. And Duisburg, the German office, the rail and inland freight desk, has yet another thing again, their own German setup. Three, four sources depending how you count, none talk to each other.

[04:14] **Daan Veldkamp:** Do the numbers line up?

[04:16] **Bart Coppens:** No — that's the killer. They don't reconcile. Antwerp counts a declaration one way, Rotterdam another. Volume doesn't match billing doesn't match what the systems say. When I want one number — "how many did we file in October and what did we bill" — there's no button I can press. No report. It doesn't exist.

[04:38] **Daan Veldkamp:** So how do you close the month?

[04:40] **Bart Coppens:** By hand. My team rebuilds the management reporting in Excel, every single month. Someone pulls an export from DUANE 4, someone pulls Antwerp, someone pulls Duisburg, and they stitch it together manually, fixing codes that don't match. A good chunk of the first week and a half of every month goes to producing a pack I can half-trust. And it's not even reliable when it's done — somebody fat-fingers a number, somebody reuses last month's tab and forgets a reference. I've caught material errors in our own board pack, more than once. Not where a 42-million company should be.

[05:14] **Daan Veldkamp:** And honestly, when we get into the data, you're probably going to hand us exactly that — the messy version.

[05:21] **Bart Coppens:** [laughs] Oh, you'll get the mess. Fair warning. I'll share the exports — the declarations dump, line-level, so you see what comes out of these systems. The HR file from Morgan, headcount and FTE. And my billing workbook, the monthly Excel I just described. Tabs on tabs, manual overrides. Not pretty, but real. I'd rather you see the truth than something I cleaned up.

[05:47] **Daan Veldkamp:** That's what we want.

[05:49] **Bart Coppens:** Right. And this feeds another problem — the DSO. Days sales outstanding, creeping up. The billing is tied to logged hours. Declarants log time, it gets reviewed, attached to a client, then I invoice. The hours come in late, messy — someone doesn't log Friday until Tuesday, the supervisor signs off a week later. Work done first week of the month, billed well into the next. Cash comes in slow. It's a process problem, not a credit problem — my clients aren't bad payers, I'm just slow to ask.

[06:19] **Daan Veldkamp:** Because the invoice trigger is a manual, delayed input.

[06:23] **Bart Coppens:** Exactly, the hours. If I could bill the moment a declaration is filed and accepted, instead of reconciling hours three weeks later — that's real working capital sitting in my clients' accounts that should be in mine.

[06:36] **Daan Veldkamp:** Alex mentioned moving toward something "value-based."

[06:40] **Bart Coppens:** I agree, in principle. The hours model is part of the trap — if I bill by the hour and AI makes my people twice as fast, I've halved my own revenue. I'm penalized for being efficient. We have to decouple price from hours — price the outcome, a filed, accepted, compliant declaration, not the time it took. But that's a commercial transformation, not just tech, and it scares people here.

[07:05] **Daan Veldkamp:** Which is why this isn't just "buy a tool."

[07:08] **Bart Coppens:** Right. And — my worry about you guys, no offense — I write a big consulting check, lots of workshops and excitement, and twelve months later my margin per declaration is exactly where it is and I'm out a few hundred thousand plus everyone's time. I've seen transformations cost more than they saved. I'm pro-AI, I'm not the blocker — but pro-AI with a real business case. Not a slide saying "30 percent efficiency gain" with no working underneath it.

[07:35] **Daan Veldkamp:** So what would a business case need to show for you to say yes?

[07:40] **Bart Coppens:** Three things. One, cost-to-serve per declaration — today versus after, the fully-loaded cost now, a credible number for after, and the bridge between them, line by line. Two, payback period. Six years, not interested, the tech will have changed three times. Under eighteen, twenty-four months, now we're talking. Three — the soft one I still care about — what could make it not work. The honest risks. Every case I've been handed assumed everything goes perfectly, and nothing ever does.

[08:11] **Daan Veldkamp:** On cost-to-serve — where does the time go inside one declaration?

[08:16] **Bart Coppens:** Not precise, that's the data problem again — Jordan, the COO, has the operational numbers. But anecdotally, a huge amount is data entry. Re-keying — taking what a client sent and typing it into the system. The actual customs expertise, the HS classification someone like Henk does, is a small slice. Most of the minutes are a smart, expensive person typing from a PDF into a screen.

[08:42] **Daan Veldkamp:** That connects — Alex said intake is quite digital. "Basically paperless now."

[08:48] **Bart Coppens:** [laughs] Oh, Alex. I love him, but no. I put a number on it — something like 86 percent of our intake is still email. An email with a PDF, or an Excel, or both. A commercial invoice as a PDF, a packing list as Excel, sometimes a scan, sometimes a photo of a document, I'm not kidding. So "paperless" — sure, we don't file paper with customs. But the front door, where the cost is? A human opens an email, downloads a PDF, types it into DUANE 4 by hand. That's the workflow on basically every declaration. Email-driven and re-keyed.

[09:23] **Daan Veldkamp:** So if the cost is in re-keying attachments —

[09:27] **Bart Coppens:** That's where the money is. That's the bit any AI thing should attack first — read the email, read the PDF, pre-fill the declaration, let the expensive human check it instead of type it. Take a declarant from typing half the declaration down to reviewing — that's cost-to-serve coming down. The operating leverage I don't have today.

[09:48] **Daan Veldkamp:** And at scale, that breaks the link between volume and headcount.

[09:52] **Bart Coppens:** Now you're speaking my language. Next 50,000 declarations need a few people, not thirty — the trap opens. That's the prize. The chatbots, the "ask the AI a question" stuff, I don't care half as much.

[10:06] **Daan Veldkamp:** Errors — that's a cost line too.

[10:09] **Bart Coppens:** Shows up in a place I hate. Customs fines and penalties — in 2024 we paid 315,000 euro. Wrong classification, wrong value, wrong origin, a missed deadline. 315k. A lot lands on us because it's our error — we filed it. And it's not just the cash, that's a few declarants' salary gone — it's the relationship. A client gets a penalty notice because we miskeyed something, that's a renewal I'm fighting to keep, probably at a discount. The error rate is a quiet tax in three places — the fine, the rework, the churn risk. If it's mostly manual re-keying errors, and I suspect it is, the same automation that cuts cost cuts errors. Same root cause.

[10:51] **Daan Veldkamp:** A system reading the document consistently doesn't have a bad Friday afternoon.

[10:56] **Bart Coppens:** [laughs] Correct. The machine doesn't get tired at 4pm Friday before a long weekend. My people do — the volume is brutal. That's where errors come from. Tired humans doing repetitive transcription under time pressure.

[11:10] **Daan Veldkamp:** Headcount — 350 FTE, declarants the bulk.

[11:14] **Bart Coppens:** Around 350. And the age profile — Morgan's the expert, but I see it on cost — it's old. A wave of senior declarants heading for retirement. Something like 47 of our most senior people due to retire within three years. The ones who know the hard stuff, the classification, the judgment. When they walk out, the knowledge walks with them. So I've got a cost problem and a knowledge-cliff at once, and they're related — the expensive seniors are the ones I most need to make more productive, and the ones I'm about to lose. Replace them with juniors who make more errors and work slower, and my cost-to-serve and fines both go up. So even holding steady gets harder. Doing nothing isn't the safe option — the "do nothing" scenario isn't flat, it's a slow decline.

[11:55] **Daan Veldkamp:** The cost of inaction — we'd want numbers on that too.

[11:59] **Bart Coppens:** Please. In this building people think the risk is doing the AI project. The bigger risk is not doing it and waking up in three years with the same margin compression, a retired senior workforce, and DeclareNow eating another five points of price. That's the scary scenario. Not the consulting invoice.

[12:18] **Daan Veldkamp:** Scoping question — the declarations dump, does it have fee per declaration, or is fee in the billing workbook?

[12:26] **Bart Coppens:** The dump is operational truth — what was filed, line items, HS codes, values, which office. The fee, the euros, that's the billing workbook, and that's where it's messy because billing's reconciled by hand against the hours. Part of your job is joining those two, and I'll warn you, the keys won't match cleanly. Client names spelled differently in each. Antwerp uses different reference codes than Rotterdam. It's the reconciliation hell my team lives in. Show me a clean join of those two files and you've done something my own finance team can't reliably do.

[13:00] **Daan Veldkamp:** [laughs] No pressure. But that data foundation is usually step one anyway — you can't automate what you can't measure.

[13:08] **Bart Coppens:** Right. I just want step one not to become step only. I've seen "data foundation" projects run a year and produce a dashboard nobody uses. I want it pointed at a decision.

[13:19] **Daan Veldkamp:** If a case came back strong — under-two-year payback, clear cost-to-serve reduction — is there budget appetite, and a champion besides you?

[13:28] **Bart Coppens:** Budget, conditionally yes. Alex sponsors it, but he wants me comfortable with the numbers and the board wants me to stand behind it — so I'm a gatekeeper. If I'm not convinced, it doesn't happen, however excited Alex is. Champion — Jordan, the COO, hundred percent. He feels the operational pain daily, the errors, the rework, the three-systems chaos, and he's wanted to standardize across the three countries for years. Morgan, HR, is more cautious — worries about the people and the jobs, rightly so. So it's me on economics, Jordan on operations, Morgan as the conscience, Alex on top wanting the growth story. That's your room.

[14:03] **Daan Veldkamp:** On Morgan's concern — the jobs question, on the P&L side?

[14:08] **Bart Coppens:** Carefully. I won't pretend "efficiency" doesn't worry people. But honestly — I don't need fewer people. I need the people I have to handle more volume without hiring proportionally more. Trade volume's growing, the work is there. Take the growth without the linear headcount cost — that's the win, and it doesn't have to mean layoffs. It means I stop the next forty hires while doubling what the current team can do. With 47 seniors retiring, I've got natural attrition anyway. The story — and I think it's true, not just comforting — is AI takes the typing, the people do the judgment, we grow into it. Morgan will want to see that's real, fair enough.

[14:43] **Daan Veldkamp:** More nuanced than "automation equals cuts." That matters for framing.

[14:48] **Bart Coppens:** It has to be, or it doesn't survive contact with this organization. Thirty-plus years old, lots of long-tenured people. Come in waving an efficiency hammer and you get nothing done. We tried pushing Antwerp onto the Rotterdam system years ago — total revolt, we backed off, that's partly why we still have three systems. So change management is half the job. Maybe more. Which says: prove value in one place first. Pick one thing, one office — Rotterdam, where the volume is. Prove cost-to-serve comes down on intake automation, get me a real number for the board, then expand. Don't sell me a three-country transformation on day one. Sell me one provable win — I'll fund the win, then the rollout once I believe it.

[15:30] **Daan Veldkamp:** Land it, prove it, scale it. And then the CFO turns from skeptic into advocate.

[15:36] **Bart Coppens:** Turn the CFO into the advocate and you've basically won the building.

[15:41] **Daan Veldkamp:** Let me confirm the numbers. Revenue 41.8 million for 2024, around 512,000 declarations, 78 blended fee — treat the blend with suspicion. 70 percent people cost, 350 FTE. Fines 315k. Intake 86 percent email-with-attachments. Margin falling three to four percent a year.

[16:01] **Bart Coppens:** Good summary. The 78 and 41.8 are solid, straight off the audited accounts. The 86 percent is an estimate — I had someone sample the inbox, directionally right but don't treat it like it came off a meter. The margin compression, the three-to-four percent, is my own analysis off that messy monthly pack — same caveat as everything I touch. I'd want your team to firm it up from the raw data. Part of why I want you in there.

[16:30] **Daan Veldkamp:** Helpful — knowing which are audited and which are estimates changes how we use them.

[16:35] **Bart Coppens:** That's the difference between a good consultant and a bad one. The bad ones put my Excel number on a slide with two decimals like it's gospel. The good ones ask where it came from.

[16:46] **Daan Veldkamp:** A single metric that, if we moved it, means success?

[16:50] **Bart Coppens:** [pause] Cost-to-serve per declaration. Bring it down structurally — not a one-off, so it stays down as volume grows — and everything follows. Margin recovers, the scalability trap opens, I can be flexible on price against DeclareNow without bleeding, the DSO improves if we re-trigger billing off the filing instead of the hours. It all hangs off that one number. Everything else is vanity next to it.

[17:18] **Daan Veldkamp:** Anything you're worried we'll miss going in?

[17:22] **Bart Coppens:** Two things. One, don't underestimate how bad the data is. People come in thinking "we'll just pull the data," then they meet DUANE 4 and the Antwerp system and realize there's no clean pull. Budget for that. Two, don't get seduced by the shiny stuff — there'll be a temptation to do something demo-able, an agent that does something clever, whatever's fashionable. I don't need impressive. I need the boring 45-minutes-of-re-keying-per-declaration to become 10 minutes of reviewing. Not a sexy demo, but that's where the entire business case lives. Solve the boring problem.

[17:58] **Daan Veldkamp:** "Solve the boring problem." Writing that down.

[18:02] **Bart Coppens:** Only way the math works. Mine is cost per declaration, it's a deeply boring number, and I love it. [laughs]

[18:09] **Daan Veldkamp:** [laughs] That's a CFO. Next steps — you'll send the three exports: declarations dump, Morgan's HR file, your billing workbook.

[18:18] **Bart Coppens:** Yep, this week — give me a day or two, I want the latest billing workbook, not last month's. And again, mess, the real thing. If something doesn't make sense, ask me — half of it only makes sense because of a workaround we set up in 2019 that nobody documented. And one thing — when the numbers don't tie, and they won't the first time, don't assume one's right and the other wrong. Assume they're measuring different things, because they usually are. Rotterdam and Antwerp don't even define a "declaration" identically.

[18:50] **Daan Veldkamp:** Different definitions, not different errors. Good tip. Any other system that touches this — finance, ERP?

[18:58] **Bart Coppens:** Finance is separate again, of course it is. It sits downstream of the operational systems, which is exactly why the hours get fed in manually. The chain: declaration filed in DUANE 4 or whatever the office uses, hours logged separately, somebody reconciles them in the billing workbook, then an invoice raised in finance. Four steps, three manual, every handoff is where time and money leak. If you want to understand the DSO, that chain is the answer. Compress that work-to-cash cycle and nothing else and I'd see it in the bank balance within a quarter.

[19:32] **Daan Veldkamp:** Each break is a target. We'll map it. Anything you want to ask me?

[19:37] **Bart Coppens:** The one I keep coming back to. When you bring me the business case, I want the downside in it. The honest one — the scenario where we spend the money and it doesn't work, what it costs me, and how we'd know early. Bring me only an upside and I won't trust the upside either. Build me the bear case and I'll believe the bull case.

[19:57] **Daan Veldkamp:** That's how we work. Base case, downside, and early indicators so you can kill it cheaply if it goes sideways.

[20:04] **Bart Coppens:** Kill it cheaply — that's the phrase. I'd rather find out in month three for a small number than month twelve for a big one. Design the off-ramp and that makes me more likely to say yes, not less. My downside's capped.

[20:18] **Daan Veldkamp:** Agreed — we'll build the stage gates in from the start. This has been excellent, Bart. I'll get a short summary back and watch for the three files.

[20:27] **Bart Coppens:** Good. And look — I know I've been the skeptic the whole call, that's my role, but there's something here. The economics can't continue the way they're going. Something has to change. I just need it to be the right something, with the numbers underneath. So don't take my pushback as a no. Take it as — show me, and I'm in.

[20:47] **Daan Veldkamp:** Best possible note to end on. Show you, and you're in.

[20:51] **Bart Coppens:** Right, board prep call in three minutes, of course. Send me the summary. Thanks, Daan — better conversation than I expected, if I'm honest.

[21:01] **Daan Veldkamp:** [laughs] I'll take that. Thanks, Bart. Talk soon.

[21:05] **Bart Coppens:** Cheers. Bye.

[21:08] _[end of recording]_
