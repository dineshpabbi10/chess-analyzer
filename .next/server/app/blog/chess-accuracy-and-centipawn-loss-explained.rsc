1:"$Sreact.fragment"
2:I[8658,["173","static/chunks/173-e936e38b90331b66.js","657","static/chunks/657-01b42027f65cf1be.js","953","static/chunks/app/blog/%5Bslug%5D/page-bc9953dbda7b0d47.js"],"AppShell"]
3:I[5244,[],""]
4:I[3866,[],""]
5:I[2386,["173","static/chunks/173-e936e38b90331b66.js","657","static/chunks/657-01b42027f65cf1be.js","953","static/chunks/app/blog/%5Bslug%5D/page-bc9953dbda7b0d47.js"],"ServiceWorker"]
7:I[6213,[],"OutletBoundary"]
9:I[6213,[],"MetadataBoundary"]
b:I[6213,[],"ViewportBoundary"]
d:I[4835,[],""]
:HL["/_next/static/css/b6cc6d016dc47b87.css","style"]
0:{"P":null,"b":"hkHQt7Tew7iCENazW-7-4","p":"","c":["","blog","chess-accuracy-and-centipawn-loss-explained"],"i":false,"f":[[["",{"children":["blog",{"children":[["slug","chess-accuracy-and-centipawn-loss-explained","d"],{"children":["__PAGE__",{}]}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/b6cc6d016dc47b87.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","children":["$","body",null,{"children":[["$","$L2",null,{"children":["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[[],[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":404}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]]],"forbidden":"$undefined","unauthorized":"$undefined"}]}],["$","$L5",null,{}]]}]}]]}],{"children":["blog",["$","$1","c",{"children":[null,["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children","blog","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":[["slug","chess-accuracy-and-centipawn-loss-explained","d"],["$","$1","c",{"children":[null,["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children","blog","children","$0:f:0:1:2:children:2:children:0","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":["$L6",null,["$","$L7",null,{"children":"$L8"}]]}],{},null,false]},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","gs3MJWn3Ubmy_euaWzPay",{"children":[["$","$L9",null,{"children":"$La"}],["$","$Lb",null,{"children":"$Lc"}],null]}]]}],false]],"m":"$undefined","G":["$d","$undefined"],"s":false,"S":true}
f:I[8173,["173","static/chunks/173-e936e38b90331b66.js","657","static/chunks/657-01b42027f65cf1be.js","953","static/chunks/app/blog/%5Bslug%5D/page-bc9953dbda7b0d47.js"],""]
e:T1253,<p>Every game report hands you a couple of numbers: an <strong>accuracy</strong> percentage and,
often, an <strong>average centipawn loss</strong>. They sound interchangeable. They are not,
and knowing the difference changes how you read your own games.</p>
<h2>Centipawns: the engine&#39;s unit of advantage</h2>
<p>Engines score positions in <strong>centipawns</strong> — hundredths of a pawn. An evaluation of
<code>+1.00</code> means White&#39;s position is worth roughly one extra pawn. <code>-2.50</code> means
Black is better by about two and a half pawns.</p>
<p>&quot;Roughly&quot; is doing real work in that sentence. The engine isn&#39;t counting material;
it&#39;s estimating the whole position — king safety, activity, structure — and
expressing it in pawn-equivalents because that&#39;s a unit humans understand.</p>
<p><strong>Centipawn loss</strong> for a single move is the difference between the best available
evaluation and what you actually got. If the best move kept you at <code>+0.80</code> and
your move left you at <code>+0.20</code>, that move cost 60 centipawns.</p>
<p>Average centipawn loss (ACPL) is that averaged over all your moves. Lower is
better. Strong players are often under 20; club players are frequently over 50.</p>
<h2>Accuracy: the same data, run through a win-probability curve</h2>
<p>Accuracy starts from centipawns but adds a crucial step: it converts the
evaluation into a <strong>probability of winning</strong>, then measures how much of that
probability your move gave away.</p>
<p>Why bother? Because centipawns are not linear in importance:</p>
<ul>
<li>Going from <code>+0.30</code> to <code>-0.30</code> is a 60-centipawn swing that genuinely matters —
you handed over the initiative in a balanced game.</li>
<li>Going from <code>+9.00</code> to <code>+8.40</code> is also 60 centipawns, and means nothing at all.
You were completely winning; you still are.</li>
</ul>
<p>A win-probability model treats those correctly: the first is a real error, the
second is a rounding difference. That&#39;s why accuracy tracks &quot;did this move change
the likely result?&quot; rather than &quot;did this move change the number?&quot;.</p>
<h2>The consequence: high accuracy can hide a bad game</h2>
<p>This is the bit that confuses people, and it&#39;s worth internalising.</p>
<p>Once a position is genuinely lost, almost nothing you do changes the win
probability — it&#39;s already near zero. So your <em>accuracy</em> for those moves stays
high even while your <em>centipawn loss</em> balloons. A game where you collapsed early
and then got mated can post a respectable accuracy figure.</p>
<p>The reverse also happens. A tense, sharp game where every move mattered will
punish small inaccuracies hard, because in a balanced position a small evaluation
change is a large win-probability change.</p>
<p><strong>Practical reading:</strong></p>
<ul>
<li><strong>Accuracy</strong> answers <em>&quot;how well did I convert my chances?&quot;</em></li>
<li><strong>ACPL</strong> answers <em>&quot;how cleanly did I play, regardless of the result?&quot;</em></li>
<li>Big gap between them (high accuracy, high ACPL) usually means a game that was
decided early and then coasted.</li>
</ul>
<h2>Why the same game scores differently on different sites</h2>
<p>Three reasons, all legitimate:</p>
<ol>
<li><strong>Engine strength and search depth.</strong> A stronger engine, or a deeper search,
finds better moves — which makes your moves look comparatively worse. Deeper
analysis usually <em>lowers</em> your reported accuracy. That isn&#39;t a bug; it&#39;s a more
demanding examiner.</li>
<li><strong>The win-probability formula.</strong> Different sites use slightly different curves
for turning centipawns into a win percentage.</li>
<li><strong>What counts as a move.</strong> Some tools exclude opening book moves, or forced
recaptures, from the average. Others don&#39;t.</li>
</ol>
<p>So compare your numbers to <em>your own</em> numbers over time, on the same tool, at the
same depth. Cross-site comparisons are noise.</p>
<h2>What to actually do with the numbers</h2>
<p>Honestly? Mostly ignore the headline percentage and look at the distribution.</p>
<p>One blunder and forty excellent moves is a completely different game from twelve
inaccuracies, even if the accuracy figure lands in the same place. The first is a
concentration problem; the second is an understanding problem. They need different
training.</p>
<p>Want to see it on one of your own games? <a href="/">Run a review</a> — or check the
<a href="/tools/analysis">Analysis Board</a> if you&#39;d rather watch the evaluation move as you
play through a line.</p>
6:["$","div",null,{"className":"page","children":["$","div",null,{"className":"page-main","children":[["$","h1",null,{"className":"page-title","children":"Accuracy and centipawn loss, explained"}],["$","p",null,{"className":"page-sub","children":"What the numbers in a game report actually measure, why a 90% accuracy game can still be a disaster, and which metric to pay attention to."}],[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"Accuracy and centipawn loss, explained\",\"description\":\"What the numbers in a game report actually measure, why a 90% accuracy game can still be a disaster, and which metric to pay attention to.\",\"datePublished\":\"2026-08-02T09:00:00.000Z\",\"dateModified\":\"2026-08-02T09:00:00.000Z\",\"mainEntityOfPage\":\"https://chess-analyzer-ruddy.vercel.app/blog/chess-accuracy-and-centipawn-loss-explained\",\"author\":{\"@type\":\"Organization\",\"name\":\"Fast Chess Analyzer\"},\"publisher\":{\"@type\":\"Organization\",\"name\":\"Fast Chess Analyzer\"}}"}}],["$","div",null,{"className":"post-meta","children":[["$","time",null,{"dateTime":"2026-08-02T09:00:00.000Z","children":"2 August 2026"}],["$","span",null,{"children":"·"}],["$","span",null,{"children":[3," min read"]}]]}],["$","article",null,{"className":"prose","dangerouslySetInnerHTML":{"__html":"$e"}}],["$","div",null,{"className":"post-foot","children":[["$","$Lf",null,{"href":"/blog","className":"link","children":"← All posts"}],["$","$Lf",null,{"href":"/","className":"primary btn-link","children":"Review one of your games"}]]}]]]}]}]
c:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1, viewport-fit=cover"}],["$","meta","1",{"name":"theme-color","content":"#302e2b"}]]
a:[["$","meta","0",{"charSet":"utf-8"}],["$","title","1",{"children":"Accuracy and centipawn loss, explained · Fast Chess Analyzer"}],["$","meta","2",{"name":"description","content":"What the numbers in a game report actually measure, why a 90% accuracy game can still be a disaster, and which metric to pay attention to."}],["$","meta","3",{"name":"application-name","content":"Fast Chess Analyzer"}],["$","link","4",{"rel":"manifest","href":"/manifest.webmanifest","crossOrigin":"$undefined"}],["$","link","5",{"rel":"canonical","href":"https://chess-analyzer-ruddy.vercel.app/blog/chess-accuracy-and-centipawn-loss-explained"}],["$","meta","6",{"name":"mobile-web-app-capable","content":"yes"}],["$","meta","7",{"name":"apple-mobile-web-app-title","content":"Chess Analyzer"}],["$","meta","8",{"name":"apple-mobile-web-app-status-bar-style","content":"black-translucent"}],["$","meta","9",{"property":"og:title","content":"Accuracy and centipawn loss, explained"}],["$","meta","10",{"property":"og:description","content":"What the numbers in a game report actually measure, why a 90% accuracy game can still be a disaster, and which metric to pay attention to."}],["$","meta","11",{"property":"og:url","content":"https://chess-analyzer-ruddy.vercel.app/blog/chess-accuracy-and-centipawn-loss-explained"}],["$","meta","12",{"property":"og:type","content":"article"}],["$","meta","13",{"property":"article:published_time","content":"2026-08-02T09:00:00.000Z"}],["$","meta","14",{"property":"article:tag","content":"analysis"}],["$","meta","15",{"property":"article:tag","content":"engine"}],["$","meta","16",{"name":"twitter:card","content":"summary"}],["$","meta","17",{"name":"twitter:title","content":"Accuracy and centipawn loss, explained"}],["$","meta","18",{"name":"twitter:description","content":"What the numbers in a game report actually measure, why a 90% accuracy game can still be a disaster, and which metric to pay attention to."}],["$","link","19",{"rel":"icon","href":"/icons/favicon-32.png","sizes":"32x32","type":"image/png"}],["$","link","20",{"rel":"icon","href":"/icons/favicon-16.png","sizes":"16x16","type":"image/png"}],["$","link","21",{"rel":"apple-touch-icon","href":"/icons/apple-touch-icon.png"}]]
8:null
