# Discovery Interview — Operations Director / COO (Jordan Smit), GlobalLogistics

**Project:** Project GlobalLogistics — GenAI Strategic Transformation (Discovery)
**Date:** 14 November 2025
**Duration:** ~47 min
**Location:** Rotterdam HQ (Waalhaven Z.z. 19) — meeting room + walk of the declaration floor
**Participants:** Jordan Smit, Operations Director (COO) · Daan Veldkamp, WAIMAKERS

_Recorded & transcribed via Maia. Auto-generated transcript — lightly cleaned._

---

**Maia auto-tags:** customs-declarations · manual-data-entry · HS-classification · system-fragmentation · error-rate-and-fines · tribal-knowledge · AI-pilot-readiness

---

**[00:00] Daan Veldkamp:** Thanks for making the time, Jordan. And for the floor walk after — I always learn more from twenty minutes on the floor than from any slide deck. Before we start, is it okay that Maia is recording? Just for our notes.

**[00:14] Jordan Smit:** Yeah, no, totally fine, record away. Honestly I'd rather you have the detail than me try to remember it. I've been waiting for this conversation, to be blunt. Alex — our CEO — he's been, let's say, cautious about all the AI stuff. Bart in finance just sees the invoice. I'm the one staring at the actual mess every single day, so. Ask me anything.

**[00:38] Daan Veldkamp:** Good, that's exactly the energy I want. Let's start simple. Walk me through what actually happens when a declaration comes in. From the moment a client sends us something, to the moment it's filed with customs.

**[00:51] Jordan Smit:** Okay. So — and this is the thing people outside the building don't get — there is no "system" where a declaration arrives. It's email. It's almost all email. We pull the numbers regularly and it's something like eighty-six percent of our volume comes in as an email with an attachment. A PDF, an Excel, sometimes a photo of an invoice somebody took on their phone. Eighty-six percent. That's the front door.

**[01:18] Daan Veldkamp:** Eighty-six percent as email plus attachment. And the other fourteen?

**[01:23] Jordan Smit:** The other fourteen is EDI. Proper electronic data interchange — the structured stuff. We'll come back to that because that fourteen percent is basically the dream and the long tail is the nightmare. But let's stay on the front door first.

**[01:37] Daan Veldkamp:** Please.

**[01:38] Jordan Smit:** So email arrives. Step one, intake. A declarant — could be junior, could be senior depending on the desk — opens the email, reads the attachment, figures out what we're even looking at. And I want you to understand: every single client formats this differently. There is no standard. None. Van Dijk Foods sends me a tidy-ish Excel. Shenzhen BrightTech sends me a two-hundred-line Excel with product names in Chinese, no HS codes, and then — I'm not joking — photos of the products as a PDF, so my declarant is sitting there going "is this a charger, is this a power bank, what is this." Antwerp Spice & Coffee, they send scanned handwritten invoices. Handwritten. In USD. We have to OCR that in our heads, basically.

**[02:31] Daan Veldkamp:** So step one is already interpretation, not just receiving.

**[02:35] Jordan Smit:** Correct. It's not data entry yet, it's archaeology. Somebody has to decide "okay this column is the quantity, this is the value, this currency is dollars not euros, this line is actually two products mashed together." And that's before anyone has typed a single character into our actual declaration software.

**[02:56] Daan Veldkamp:** Okay so that's step two — typing it in. Tell me about that.

**[03:01] Jordan Smit:** Step two, data entry. The declarant takes whatever they've figured out and they manually type it into our legacy system. Field by field. Consignor, consignee, line items, values, weights, country of origin, the HS code if they have it — which, spoiler, on the bad clients they don't. And this is slow. We benchmarked it. Average declaration takes about forty-five minutes of data entry. Forty-five.

**[03:30] Daan Veldkamp:** Forty-five minutes per declaration.

**[03:32] Jordan Smit:** Per declaration, blended average. A clean one with ten lines from a good client, maybe fifteen minutes. A Shenzhen BrightTech two-hundred-liner with no codes? That's half a day, easy, and it's bouncing between two people. So forty-five is the average but the variance is brutal. And — this is the part that keeps me up — it's manual typing, so it's error-prone by definition. Human types two hundred lines of part numbers and values, somebody's going to fat-finger a digit.

**[04:04] Daan Veldkamp:** Let's hold on errors, I want to come back to that properly. Step three?

**[04:09] Jordan Smit:** Step three is classification. This is the crown jewels, honestly. Every line on a declaration needs an HS code — Harmonised System, the customs tariff code. Eight digits, sometimes ten with the national bit. That code decides the duty rate, whether there's a license needed, whether it's restricted, everything. Get it wrong and you've either underpaid duty — which is a fine — or you've overpaid and the client's furious. So somebody has to look at "hand-knotted wool carpet" and know that's 5701.10.10 at eight percent duty, or "frozen Atlantic salmon fillets" is 0304.81.00 at two percent.

**[04:51] Daan Veldkamp:** And who does that classification?

**[04:54] Jordan Smit:** That's the problem. For the clean stuff, the declarant doing data entry can handle it — it's a repeat client, same products, they know the codes. But roughly — let me get this right — about eighteen percent of our lines get escalated. Eighteen percent of lines we can't classify at the desk, so they go up to a senior declarant. And the senior declarants are... not plentiful. They're the ones with twenty, thirty, thirty-eight years in. They've got the tariff in their head.

**[05:28] Daan Veldkamp:** Eighteen percent escalation. That's almost one in five.

**[05:32] Jordan Smit:** One in five lines, yeah. And every one of those is a senior person stopping what they're doing to make a judgment call. It's the bottleneck. We've got declarations sitting in a queue not because the data's not entered but because we're waiting on Henk — Henk Mulder, you'll talk to him I think — waiting on Henk to tell us whether a thing is a "part of a machine" or "the machine." Sounds trivial. It's a four-percent duty difference on a container.

**[06:01] Daan Veldkamp:** And step four?

**[06:03] Jordan Smit:** Step four, submission. We submit to Customs — the Douane here in NL — electronically. And once it's in, it's in. If the data was wrong, you don't get a gentle nudge. You get a correction procedure, possibly a fine, possibly an audit flag if it keeps happening. Customs compliance is unforgiving. That's the phrase I keep using internally — it's unforgiving. There's no "oops, let me fix that" once it's filed and the goods have moved.

**[06:36] Daan Veldkamp:** So four steps. Intake, data entry, classification, submission. Let me reflect that back — the value, the expertise, is concentrated in step three, classification. Steps one and two are high-effort but low-judgment. Is that fair?

**[06:54] Jordan Smit:** That's... honestly that's the cleanest anyone's put it. Yes. Steps one and two are forty-five minutes of a smart person doing typing and detective work that a machine should be doing. Step three is the actual professional expertise. Step four is just hitting send and praying. So we've got our most expensive people — and our scarcest — spending most of their day on one and two so they've got no time for three, which is the only bit that needs them.

**[07:24] Daan Veldkamp:** That's a really important framing. Let's talk about the errors, because you keep circling back to it. What's the actual number?

**[07:33] Jordan Smit:** Our average error rate is around two point nine percent. Across all declarations, lines with an error of some kind — wrong code, wrong value, wrong weight, transposed figure. Two point nine.

**[07:46] Daan Veldkamp:** And is that... how do you feel about that number?

**[07:50] Jordan Smit:** [laughs] I have complicated feelings about that number. On a good day I tell myself two-point-nine on five hundred thousand-plus declarations a year, with the garbage we get fed, is a small miracle and my people are heroes. On a bad day I look at what two-point-nine costs us. Because last year, 2024, we paid three hundred and fifteen thousand euros in customs penalties. Fines. Three-fifteen. Directly traceable to errors. That's not a soft cost, that's not "lost productivity," that's a wire transfer to a customs authority because we got a number wrong.

**[08:30] Daan Veldkamp:** Three hundred and fifteen thousand in fines, tied to the error rate.

**[08:34] Jordan Smit:** Tied to it, yeah. And Bart — the CFO — he sees that line and he loses his mind, rightly. But here's what frustrates me. A big chunk of those errors aren't classification errors, the hard judgment calls. They're step-two errors. Somebody typed 1,200 instead of 12,000. Somebody put the value in dollars but flagged it as euros. Transposition, units, currency. Dumb, mechanical, avoidable mistakes that happen because a human is hand-keying two hundred lines at four in the afternoon. Those should not exist in 2025. That's the part that makes me want to fix this with technology, because that's the part technology is actually good at.

**[09:18] Daan Veldkamp:** That's a sharp distinction — the expensive errors are mostly the cheap-to-prevent kind.

**[09:24] Jordan Smit:** Exactly. The classification errors, the genuinely hard ones — I almost forgive those, those are judgment in a grey area. The data-entry errors I can't forgive, and they're the bulk of the volume of mistakes. Maybe not the bulk of the fine value, the big fines are usually a misclassification on a high-duty container, but the volume — the constant little corrections, the rework, the client calling up annoyed — that's all step two.

**[09:52] Daan Veldkamp:** Let me pivot to systems, because you hinted at it. You're across three countries.

**[09:58] Jordan Smit:** Three countries, three systems, and this is where I genuinely want to bang my head on the desk. Here in Rotterdam we run DUANE 4 — that's our main NL declaration platform, it's the big hub, hundred-ninety people. Then Antwerp, our Belgian office, they're on the Belgian customs systems — PLDA, and NCTS for the transit movements. Completely separate environment, separate logins, separate everything. And then Duisburg, the German desk, the inland rail freight — they've got their own German setup, ATLAS-flavoured, bolted together over the years.

**[10:39] Daan Veldkamp:** Three completely separate stacks.

**[10:42] Jordan Smit:** Three islands. They do not talk to each other. At all. So — practical consequence number one — I cannot give you a single dashboard of how GlobalLogistics is performing. I literally cannot compare KPIs across the three offices because the data lives in three formats in three systems and somebody has to manually pull and mash it in Excel, which takes my ops analyst the better part of a week every month, and by the time it's done it's already out of date.

**[11:13] Daan Veldkamp:** So no apples-to-apples on, say, error rate per office, or throughput per declarant.

**[11:19] Jordan Smit:** Right. I have a gut feeling Antwerp's error rate is worse than Rotterdam's because of the kind of clients they handle — more of the messy USD scanned-invoice stuff comes through the port. But I can't prove it cleanly because the systems define an "error" slightly differently and don't export the same fields. It's maddening. I'm running an operation by gut and Excel duct tape.

**[11:44] Daan Veldkamp:** And consequence number two?

**[11:46] Jordan Smit:** Double entry at the borders. This is the one that really stings. A shipment comes in through Antwerp, moves on transit, gets cleared inland — the same shipment data gets keyed into the Belgian system and then effectively re-keyed for the onward movement in another system. We're typing the same consignment twice, sometimes three times, in three different tools, because they don't share a backbone. Every re-key is another chance to introduce an error and another forty-five minutes — well, not forty-five, but another chunk of time — gone. We're paying for the same data entry multiple times.

**[12:24] Daan Veldkamp:** That double entry — is that a big share of Duisburg's and Antwerp's load?

**[12:29] Jordan Smit:** For the transit-heavy flows, yeah, it's significant. Duisburg is rail freight coming inland, a lot of it has already been touched in Antwerp or Rotterdam. So Duisburg is sometimes the third person to type the same container. It's insane when you say it out loud. And no standardization means even our internal procedures differ — the way a Rotterdam declarant validates a value is not the way an Antwerp one does it. I've got three operations pretending to be one company.

**[13:00] Daan Veldkamp:** Standardization across the three is clearly something you want.

**[13:04] Jordan Smit:** It's the thing I want most, honestly, even more than the AI. If I could wave a wand: one standard intake process, one definition of an error, one place I can see all three offices. Now — I'm realistic, I'm not going to rip out three national customs systems, those are tied to the actual customs authorities, you can't just replace DUANE or PLDA. But everything that sits in front of them? The intake, the data prep, the classification support? That could be standardized. That's the layer I think you can help with.

**[13:38] Daan Veldkamp:** That's a really useful boundary — you're not asking to replace the systems of record, you're asking to standardize the work that feeds them.

**[13:46] Jordan Smit:** Yes. Build the smart layer in front. Leave DUANE and PLDA and the German thing as the dumb pipes they are. I don't care that they don't integrate if the work that produces the data is consistent and clean before it ever hits them.

**[14:02] Daan Veldkamp:** Let's go deeper on the clients, because you've mentioned a few and I think this is where the candidate— sorry, where the team is going to need real texture. Paint me the spectrum. Who's the worst, who's the best?

**[14:16] Jordan Smit:** Oh, I have a list. [laughs] Top of the pain charts: Shenzhen BrightTech. Consumer electronics out of China. They send these enormous Excels, two hundred lines plus, and the product descriptions are half in Chinese, half in this broken-English marketing speak — "Mini Smart Power Cube Pro" — and zero HS codes. And then to "help" us they attach a PDF that's just photos of the products. So my declarant is cross-referencing a photo of a thing against a Chinese product name trying to work out if it's a smartphone, which is 8517.13.00 and zero duty, or some accessory that's classified totally differently. It's a nightmare and it's high volume.

**[15:01] Daan Veldkamp:** And the currency, the language — that's all extra friction.

**[15:05] Jordan Smit:** USD on top, so everything has to be converted. Then Antwerp Spice & Coffee — Belgian, coffee and spices. Lovely people, terrible paperwork. Scanned handwritten invoices. Handwritten. In USD. So now we're doing handwriting recognition by eyeball and currency conversion and trying to tell crushed black pepper, which is 0904.12.00, four percent duty, apart from whole pepper, which is a different code. The handwriting alone adds twenty minutes.

**[15:38] Daan Veldkamp:** [laughs] Who else is on the wall of shame?

**[15:41] Jordan Smit:** Istanbul Carpet & Home. Turkish home textiles, USD, and just... messy. Inconsistent formats month to month, sometimes an Excel, sometimes a Word doc, sometimes pasted into the email body. Hand-knotted wool carpets need careful classification — there's a whole thing about knots per square metre and material — so it's both messy intake and tricky classification, the worst combination. And then there's a cluster of the mid-tier messy ones — TextielTrade Twente, Dutch textiles, they're sloppy. Bodega Torres, the Spanish wine, format's a bit loose. Mumbai Generics, pharma APIs out of India, very low document quality and high-stakes because it's pharma ingredients. That one scares me a bit honestly.

**[16:30] Daan Veldkamp:** And the flip side — who do you love?

**[16:33] Jordan Smit:** Lindqvist Pharma, Swedish. Beautiful. Clean structured files, English, HS codes already on there mostly, consistent every single time. Düsseldorf Machine Tools, German machinery — structured, almost EDI-quality, they know their codes, 8458 for the CNC stuff, they basically do half our job for us. Rheinmetall Components, German auto parts, also very clean. Alpenwasser, the Swiss mineral water, tidy. The pattern's obvious right? The clean ones are the big, sophisticated, German and Nordic shippers who've invested in their own systems. The messy ones are the long tail.

**[17:14] Daan Veldkamp:** So tell me about that fourteen percent — the EDI clients — because you teased it earlier.

**[17:20] Jordan Smit:** Right, so the truly good clients are EDI-integrated. Maybe fourteen percent of our volume comes in as proper structured electronic data — it lands, it maps to our fields automatically, the codes are mostly there. Those declarations are basically touchless. A declarant glances at it, sanity-checks, hits submit. Fifteen minutes becomes three minutes. Error rate on those is almost nothing because no human's retyping anything.

**[17:50] Daan Veldkamp:** So you already have a touchless model — it just only covers fourteen percent.

**[17:55] Jordan Smit:** That's the whole thing in one sentence, yeah. We have proof the touchless model works. It exists, it's running, it's the best fourteen percent of our business. The problem is the other eighty-six percent will never send us EDI. They're too small, too unsophisticated, too "we've always emailed you a PDF, why would we change." I can't force a thousand small importers to build EDI integrations. So the question I keep asking — and this is really why you're here — is: can AI take the messy eighty-six percent and make it behave like the clean fourteen? Can I get the long tail to touchless, or close, without the client changing anything they do?

**[18:38] Daan Veldkamp:** That is a fantastic framing of the opportunity, and I'm writing it down word for word. Take the unstructured eighty-six and make it behave like the structured fourteen.

**[18:49] Jordan Smit:** That's the prize. If you get me even halfway there — if you turn a forty-five minute declaration into a fifteen-minute one where the human just reviews and approves instead of types — the math on five hundred thousand declarations a year is enormous. Bart can do that math. I just want my people to stop typing.

**[19:10] Daan Veldkamp:** Let's talk about your people, then, because that's a thread through everything — the classification expertise. You mentioned Henk. Tell me about the knowledge risk.

**[19:21] Jordan Smit:** [pause] This is the part that genuinely worries me at night, more than the fines even. Our classification expertise lives in people's heads. It's tribal knowledge. Henk Mulder — thirty-eight years here — Henk can look at almost anything and tell you the code, the duty rate, the exceptions, the "well actually if it's for industrial use it's a different heading" nuances. That's not written down anywhere. It's in Henk. And in a handful of others like him.

**[19:53] Daan Veldkamp:** And the demographics of that group?

**[19:56] Jordan Smit:** Terrifying. Our declarant workforce is old. Like, properly skewed — a huge chunk are over fifty, a big slice over fifty-eight. We did a workforce projection: we've got something on the order of forty-seven senior declarants who are going to retire within about three years. Forty-seven. Henk himself retires in fourteen months. Fourteen months. And when he walks out the door, thirty-eight years of HS classification judgment walks out with him, and we have not captured a single bit of it in any system.

**[20:33] Daan Veldkamp:** So there's a cliff coming.

**[20:35] Jordan Smit:** There's a cliff. And the junior pipeline can't replace it fast enough — it takes years to build that classification instinct, and frankly young people don't want to come do customs declarations, it's not sexy. So I've got rising volumes, a shrinking pool of the only people who can do the hard eighteen percent, and a hard retirement deadline on my single most knowledgeable person. That's not a productivity problem, that's an existential one for the quality of our compliance.

**[21:06] Daan Veldkamp:** Does that change how you think about the AI? Because there's the efficiency angle — the forty-five minutes — and then there's this.

**[21:14] Jordan Smit:** Hundred percent it changes it. Look, the efficiency story sells the project to Bart. But the knowledge-capture story is what makes it strategic to me. If we can build something — and you tell me if this is fantasy — something that learns from how Henk classifies, that captures the patterns, the past declarations, the reasoning, so that when Henk's gone there's a system that can suggest "this is probably 8458.11.20, here's why, here are the three similar past cases," and a junior can work off that... that's not just faster. That's the difference between us still being able to do this job in three years or not.

**[21:55] Daan Veldkamp:** So classification support — an assistant that proposes the code with reasoning and precedent, for a human to confirm.

**[22:03] Jordan Smit:** Propose and a human confirms. I want to be really clear about that, because here's where I get nervous about the AI hype. In customs, the AI cannot hallucinate an HS code. It just can't. If your fancy model confidently invents 8471.30.00 for something that's actually a 9503 toy, we file it, the goods move, and three months later we get a fine and an audit flag. The AI being confidently wrong is worse than a human being slowly right. So whatever we build, there has to be a human in the loop on classification, full stop. It suggests, it shows its reasoning, it shows the precedent, and a qualified declarant signs off. Especially while we still have the qualified declarants to do the signing off.

**[22:51] Daan Veldkamp:** That's exactly the right instinct and it's reassuring to hear it from you, frankly. A lot of operators want to skip the human review to maximize the savings.

**[22:60] Jordan Smit:** No, no. Not in this domain. The whole value of GlobalLogistics is that we're accurate and compliant. If we trade accuracy for speed we've lit our reputation on fire. Customs compliance is unforgiving — I'll keep saying it. The AI has to make my good people faster and my junior people safer. It does not get to replace the judgment. At least not on classification. On data entry? Sure, take the whole thing, I don't need a human lovingly retyping a part number.

**[23:33] Daan Veldkamp:** That's a clean line. Full automation candidate on data entry and intake; assistive, human-confirmed on classification.

**[23:42] Jordan Smit:** Yes. That's how I'd carve it. Steps one and two — intake and data entry — I want as automated as you can possibly make it, because there's no judgment there, it's extraction and structuring. Step three, classification — assistive, never autonomous, not yet. Step four, submission — that's just the API call once a human's approved, that part's easy, it's already electronic.

**[24:08] Daan Veldkamp:** Let me push on the data, because everything you're describing — intake automation, classification suggestions — that all lives or dies on data quality and history. What do you actually have?

**[24:21] Jordan Smit:** [exhales] Okay, honest answer. We have years of historical declarations. Years. Every one we've ever filed is sitting in those three systems — what the client sent, what we entered, what code we assigned, whether it got corrected or fined. So there's a goldmine of training material in principle. The problem is it's in three systems, it's not clean, and a lot of the "why" — why Henk picked that code — isn't recorded, just the final code. So we have the answers but not always the reasoning.

**[24:55] Daan Veldkamp:** That's a really honest answer and it's the right one. The label is there, the rationale often isn't.

**[25:02] Jordan Smit:** Right. And the input side is messy by definition — the whole point is the inputs are garbage PDFs and handwritten invoices. So if you're going to learn intake automation you're learning from intentionally messy data, which I guess is also the point, that's the real distribution. But I want to set expectations with you and with Alex: the data exists, it is not pristine, and somebody is going to have to do real work to wrangle it before any of this is magic. I've watched enough vendor demos on clean data to know the demo is not the deployment.

**[25:36] Daan Veldkamp:** That cynicism is healthy and it's accurate. Tell me about the floor — the people who'd actually use this. What's the appetite, the resistance?

**[25:46] Jordan Smit:** Mixed, and I won't sugar-coat it. The younger declarants, the thirty-somethings, they'd take it tomorrow. They hate the typing as much as I do, they've used ChatGPT, they get it. The problem is the demographic we talked about — the fifty-plus crowd, who are also my most valuable people on classification. Some of them hear "AI" and they hear "they're replacing me before my pension." And Henk — Henk is openly skeptical, he's made comments about "computers doing his job," and I get it, it's his identity, thirty-eight years.

**[26:21] Daan Veldkamp:** So there's a change-management dimension that's tangled up with the knowledge-capture dimension. The person you most need to learn from is the most resistant.

**[26:30] Jordan Smit:** Exactly the trap. The person whose brain I most need to capture is the person most worried I'm trying to make him obsolete. And if he digs in, if the seniors decide this is a threat and quietly sabotage it — and "quietly not cooperating" is a very effective sabotage — the whole thing fails. Doesn't matter how good the model is. So whatever we do, the framing on the floor has to be "this makes you faster and it preserves your expertise," not "this replaces you." And I need that to be true, not just spin.

**[27:05] Daan Veldkamp:** Morgan in HR is going to be a big part of that conversation.

**[27:09] Jordan Smit:** Morgan's going to be all over it, and rightly. Morgan's whole thing is wellbeing and retention and not torching the culture, and Morgan is going to ask "are people losing their jobs." And I need a good answer. My honest answer is: I don't need fewer people, I've got rising volume and a retirement cliff, I need the people I have to handle more without burning out and to not lose the irreplaceable ones. This isn't a headcount-cutting play for me. If it becomes one in Bart's head, we'll have a problem.

**[27:42] Daan Veldkamp:** That tension between you and the CFO on the framing is worth us being aware of. Let me ask the practical one — if we did something, where would you start? You wouldn't boil the ocean.

**[27:54] Jordan Smit:** God, no. Please don't propose a three-year transform-everything programme, Alex will say no and he'll be right to. I'd want to pilot. Narrow. One segment, prove it, then expand. And I've thought about this — I'd pick a single client segment where the pain is real but the scope is bounded.

**[28:16] Daan Veldkamp:** What would you pick?

**[28:18] Jordan Smit:** Honestly I'd be tempted to pick one of the messy-but-repetitive ones. Like — take the consumer electronics flow, the Shenzhen BrightTech type. High volume, painful, but actually quite repetitive once you crack it, because they ship the same categories of product over and over. If you can teach a system to take a BrightTech Excel and a product photo and produce a structured, mostly-classified draft declaration that a human just reviews — and you can show me that cuts the time and the error rate on that one flow — I can take that to Alex and Bart as proof. One flow, clean before-and-after numbers.

**[28:56] Daan Veldkamp:** A bounded pilot on a high-volume, high-pain, repetitive segment, with a clear before-and-after.

**[29:03] Jordan Smit:** Yeah. Or the alternative — and I go back and forth — is start with the data entry automation across the board rather than one client. Because the intake-and-extraction problem is common to everyone. But I think for proving it, narrow-and-deep on one segment beats wide-and-shallow. Show me one flow going from forty-five minutes and a three-ish percent error rate to fifteen minutes and under one percent. That's a slide that sells itself.

**[29:32] Daan Veldkamp:** What would make you call the pilot a success? Be specific — numbers.

**[29:37] Jordan Smit:** Three things. One, time per declaration on that flow — I want to see forty-five down toward fifteen, that's the headline. Two, error rate on that flow — under one percent, ideally, definitely below our two-point-nine average. Three, and this is the soft one but it matters most to me — the declarants on that flow tell me they trust it and it makes their day better, not worse. If I hit the first two but the floor hates it, I've failed, because it won't scale. The adoption number is as real to me as the time number.

**[30:12] Daan Veldkamp:** That's a mature definition of success — efficiency, quality, and adoption, all three.

**[30:18] Jordan Smit:** I've been burned by tools that looked great in the business case and that nobody on the floor actually used. We bought a "workflow tool" four years ago, beautiful demo, sits there unused because it didn't fit how people actually work. I'm not doing that again. If the thing isn't easier than the current way for the person doing the job at four in the afternoon, it's dead.

**[30:42] Daan Veldkamp:** Let's do a few rapid ones to round out the picture. Volume — remind me of scale.

**[30:48] Jordan Smit:** North of five hundred thousand declarations a year across the three offices. Five-twelve-ish was last year's number. Rotterdam's the bulk of it, then Antwerp, then Duisburg.

**[30:60] Daan Veldkamp:** And revenue model — you bill per declaration?

**[31:04] Jordan Smit:** Blended, it's roughly seventy-something euros per declaration on average — it's a per-declaration fee model, basically. Which Bart will tell you is the strategic problem, because if a declaration takes forty-five minutes of skilled labour and we charge seventy-eight euros, the margin's thin and getting thinner as wages rise. That's actually the deepest reason this matters — it's not just nice-to-have efficiency, the unit economics of doing it manually are going underwater. If a declaration costs us more in labour than the fee, the business model breaks. AI isn't a luxury for us, it might be survival of the per-declaration model.

**[31:43] Daan Veldkamp:** So efficiency isn't optional, it's the only way the per-declaration price stays viable.

**[31:49] Jordan Smit:** That's Bart's whole argument and on this one he and I completely agree. The manual model doesn't scale and the margin's eroding. Either the cost per declaration comes down or the model dies. That's the real stakes.

**[32:04] Daan Veldkamp:** Last big question before we walk the floor. If you imagine eighteen months from now and this went brilliantly — what does the operation look like?

**[32:14] Jordan Smit:** [pause] Okay, dream version. Email comes in with a messy PDF or Excel from any client. A system reads it — extracts the line items, the values, the quantities, normalizes the currency, structures it. For the lines it's confident on, it pre-fills the HS code with the reasoning shown. The declarant opens a clean, mostly-complete draft instead of a blank form and a pile of attachments. They review, they fix the handful the system flagged as uncertain, the genuinely hard classification calls still go to a senior but now the senior's got the system's suggestion and the three closest past cases sitting right there. They confirm, it submits. Forty-five minutes becomes fifteen. The seniors spend their time on the truly hard one-in-five, not on typing. And critically — Henk's knowledge is in the system, so when Henk retires, the floor doesn't fall off a cliff.

**[33:13] Daan Veldkamp:** And the three offices?

**[33:15] Jordan Smit:** Same smart layer in front of all three. Same intake, same classification support, same definition of done — even though the systems of record underneath are still DUANE and PLDA and the German thing. And finally — finally — I can see all three offices in one view because the front layer is standardized even if the back layers aren't. That's the dream. Standardized work, captured knowledge, humans doing judgment instead of typing.

**[33:44] Daan Veldkamp:** That's a genuinely clear vision, Jordan. I think the team's going to have a lot to work with. Anything you're worried we'll miss, or that the data won't show us?

**[33:55] Jordan Smit:** A couple of things. One — the data will make the messy clients look like the problem, and they are, but don't lose the human story underneath, which is the retirement cliff. The numbers show you forty-five minutes and two-point-nine percent. They don't show you that the only people who can fix the hard cases are leaving. Don't let the spreadsheet hide Henk.

**[34:20] Daan Veldkamp:** Noted. That's important.

**[34:22] Jordan Smit:** Two — be careful believing the offices are comparable. When you get the data exports, Rotterdam, Antwerp and Duisburg will define fields differently, an "error" might mean different things, dates and formats will be inconsistent. If you just merge the three and average them you'll get a number that's confidently wrong. Treat them as three separate datasets that happen to be the same company. And three — the EDI clients will look "too clean." That fourteen percent will skew anything you average. Look at the eighty-six percent on its own, because that's the actual problem you're being asked to solve.

**[34:58] Daan Veldkamp:** That's incredibly useful guidance — separate the offices, segment out the clean EDI tail, and keep the human risk in frame. I'll make sure that's front and centre.

**[35:09] Jordan Smit:** Good. And look — I'm enthusiastic, you can tell. But I want a partner who's realistic. Anyone who comes back and says "we'll fully automate classification and fire half the floor" — I'll throw them out, because they don't understand customs and they don't understand my people. Anyone who says "here's a bounded pilot on one flow, here's how we capture the seniors' knowledge, here's the human-in-the-loop on the codes, here's how we don't get fined" — that person I'll move heaven and earth for. The reason I'm leaning in is I think this is doable. I just need it done by people who respect that it's unforgiving.

**[35:50] Daan Veldkamp:** That's exactly the brief. Okay — shall we walk the floor? I want to see an actual declaration get built, and I'd love you to show me a Shenzhen BrightTech one if there's one in the queue.

**[36:02] Jordan Smit:** [laughs] Oh there's always one in the queue. Come on, grab your badge. I'll show you the wall of monitors and you can watch Greetje try to figure out what a "Mini Smart Power Cube Pro" actually is. Bring your sense of humour.

**[36:16] Daan Veldkamp:** [laughs] Wouldn't miss it. Let's go.

_[36:20 — recording continues on the floor walk; transcription degraded due to ambient noise. Key captured fragments below.]_

**[38:44] Jordan Smit:** ...so this is the intake desk, see, three monitors — email open here, the attachment open here, DUANE open here, and she's just... eyes going back and forth, typing. This is the forty-five minutes. This is the whole problem in one human being's afternoon...

**[40:31] Jordan Smit:** ...and watch — that line there, she doesn't know the code, so it goes into the escalation queue, and that queue routes to Henk or one of the other two seniors. See how long that queue is? That's the eighteen percent. That's the bottleneck made physical...

**[42:50] Jordan Smit:** ...Henk's desk is over there, I won't disturb him, he's classifying. But that — the stuff in his head — that's the forty-seven retirements, that's the fourteen months. Every code he assigns today and doesn't write down the reasoning for is knowledge we lose...

**[44:38] Jordan Smit:** ...and over here's the EDI flow, the clean fourteen percent — see, nobody's even sitting here really, it just runs. That's the contrast. That desk versus that desk. Same company. That's the gap you're closing...

**[46:10] Daan Veldkamp:** This has been genuinely one of the most useful discovery sessions I've done. Thank you, Jordan. I'll get you a written summary and we'll line up the data exports — and I'll flag the three-offices and EDI caveats to whoever's wrangling it.

**[46:31] Jordan Smit:** Perfect. Send me whatever you need pulled and I'll get ops to export it — all three systems, and I'll get you the historical declarations too. Just — remember the floor. The numbers are real but the people are the story. Talk soon, Daan.

**[46:48] Daan Veldkamp:** Will do. Thanks again.

_[47:02 — end of recording]_
