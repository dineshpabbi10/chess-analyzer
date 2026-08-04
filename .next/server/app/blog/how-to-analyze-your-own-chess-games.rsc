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
0:{"P":null,"b":"hkHQt7Tew7iCENazW-7-4","p":"","c":["","blog","how-to-analyze-your-own-chess-games"],"i":false,"f":[[["",{"children":["blog",{"children":[["slug","how-to-analyze-your-own-chess-games","d"],{"children":["__PAGE__",{}]}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/b6cc6d016dc47b87.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","children":["$","body",null,{"children":[["$","$L2",null,{"children":["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[[],[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":404}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]]],"forbidden":"$undefined","unauthorized":"$undefined"}]}],["$","$L5",null,{}]]}]}]]}],{"children":["blog",["$","$1","c",{"children":[null,["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children","blog","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":[["slug","how-to-analyze-your-own-chess-games","d"],["$","$1","c",{"children":[null,["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children","blog","children","$0:f:0:1:2:children:2:children:0","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":["$L6",null,["$","$L7",null,{"children":"$L8"}]]}],{},null,false]},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","fiL3l2km5TcmjDfr5ruTY",{"children":[["$","$L9",null,{"children":"$La"}],["$","$Lb",null,{"children":"$Lc"}],null]}]]}],false]],"m":"$undefined","G":["$d","$undefined"],"s":false,"S":true}
f:I[8173,["173","static/chunks/173-e936e38b90331b66.js","657","static/chunks/657-01b42027f65cf1be.js","953","static/chunks/app/blog/%5Bslug%5D/page-bc9953dbda7b0d47.js"],""]
e:T1122,<p>Running an engine over a game is easy. Learning something from it is not. The
usual failure looks like this: you click through the report, see that move 24 was
a blunder, think <em>&quot;yes, obviously&quot;</em>, and close the tab. Nothing changes.</p>
<p>The problem is that the engine answers a question you didn&#39;t ask. It tells you
<strong>what</strong> the best move was. Improvement comes from understanding <strong>why you didn&#39;t
play it</strong>.</p>
<p>Here is a routine that fixes that. It takes about ten minutes per game.</p>
<h2>1. Guess before you look</h2>
<p>Before you turn the engine on, replay the game and write down — actually write
down — the two or three moments where you felt uncertain. Where did you stop
knowing what to do? Where did you spend most of your clock?</p>
<p>This matters because your <em>felt</em> difficulty and your <em>actual</em> mistakes often
happen at different moves. That gap is the most useful thing in the whole
exercise.</p>
<h2>2. Now run the engine, and compare the lists</h2>
<p>Run the review and look at where the real errors are. You will usually find one
of three patterns:</p>
<ul>
<li><strong>You felt fine and it was a blunder.</strong> This is a knowledge or blindness
problem: you didn&#39;t see the idea at all. These are the moves worth studying
deeply.</li>
<li><strong>You felt uncertain and it was fine.</strong> Good news, and worth noticing — you are
probably burning clock on positions you actually handle well.</li>
<li><strong>You felt uncertain and it was bad.</strong> This is a decision-making problem. You
knew something was wrong and still couldn&#39;t find it.</li>
</ul>
<h2>3. Ask &quot;what would I need to have seen?&quot;</h2>
<p>For each real mistake, don&#39;t just note the better move. Name the <em>pattern</em>:</p>
<ul>
<li>Did you miss a specific tactic? (a fork, a pin, a back-rank issue)</li>
<li>Did you miss that a piece was undefended?</li>
<li>Did you have a plan and keep executing it after it stopped making sense?</li>
<li>Did you know the right idea but reject it because it looked scary?</li>
</ul>
<p>That sentence — &quot;I missed that my knight was the only defender of f2&quot; — is the
lesson. The move itself isn&#39;t transferable. The pattern is.</p>
<h2>4. Replay the position, don&#39;t just read about it</h2>
<p>Reading &quot;Nxf7 was winning&quot; builds almost nothing. Sitting in the position and
having to <em>find</em> the move is what builds recognition. This is why our review has
a <strong>Drill mistakes</strong> button: it replays each position from just before your error
and asks you to find something better. Same positions, active recall.</p>
<h2>5. Look for repeats across games, not within one</h2>
<p>One blunder is noise. The same blunder three times is a training plan.</p>
<p>This is the single biggest reason to analyse in batches rather than one game at a
time. When you look at ten games together, questions become answerable:</p>
<ul>
<li>Is my accuracy worse in the endgame than the opening?</li>
<li>Do my blunders cluster after move 30 — that is, when I&#39;m short on time?</li>
<li>Is there an opening where I score badly <em>and</em> play inaccurately?</li>
</ul>
<p>The <a href="/coach">Coach</a> does exactly this aggregation: it analyses a batch of your
recent games and reports accuracy by phase, blunder rate over the course of the
game, and per-opening results. The point isn&#39;t the numbers themselves — it&#39;s that
they tell you which of the four or five things you <em>could</em> work on is actually
costing you games.</p>
<h2>A note on accuracy scores</h2>
<p>Don&#39;t chase the accuracy percentage. It is a useful summary, but it is heavily
influenced by how sharp the position was — a quiet game where nobody had a chance
to go wrong will score higher than a messy fight you defended brilliantly.</p>
<p>Use it as a trend across many games, not a grade on one.</p>
<h2>The short version</h2>
<ol>
<li>Note where you felt lost, <em>before</em> the engine.</li>
<li>Run the review and compare the two lists.</li>
<li>For each real error, name the pattern, not the move.</li>
<li>Replay the position instead of reading the answer.</li>
<li>Batch ten games to find what repeats.</li>
</ol>
<p>Ready to try it? <a href="/">Review a game</a> or
<a href="/coach">batch-analyse your recent games</a>.</p>
6:["$","div",null,{"className":"page","children":["$","div",null,{"className":"page-main","children":[["$","h1",null,{"className":"page-title","children":"How to analyse your own chess games (a routine that actually works)"}],["$","p",null,{"className":"page-sub","children":"Most players run an engine, nod at the red marks, and learn nothing. Here is a repeatable routine that turns one game into one concrete lesson."}],[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"How to analyse your own chess games (a routine that actually works)\",\"description\":\"Most players run an engine, nod at the red marks, and learn nothing. Here is a repeatable routine that turns one game into one concrete lesson.\",\"datePublished\":\"2026-08-01T09:00:00.000Z\",\"dateModified\":\"2026-08-01T09:00:00.000Z\",\"mainEntityOfPage\":\"https://chess-analyzer-ruddy.vercel.app/blog/how-to-analyze-your-own-chess-games\",\"author\":{\"@type\":\"Organization\",\"name\":\"Fast Chess Analyzer\"},\"publisher\":{\"@type\":\"Organization\",\"name\":\"Fast Chess Analyzer\"}}"}}],["$","div",null,{"className":"post-meta","children":[["$","time",null,{"dateTime":"2026-08-01T09:00:00.000Z","children":"1 August 2026"}],["$","span",null,{"children":"·"}],["$","span",null,{"children":[3," min read"]}]]}],["$","article",null,{"className":"prose","dangerouslySetInnerHTML":{"__html":"$e"}}],["$","div",null,{"className":"post-foot","children":[["$","$Lf",null,{"href":"/blog","className":"link","children":"← All posts"}],["$","$Lf",null,{"href":"/","className":"primary btn-link","children":"Review one of your games"}]]}]]]}]}]
c:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1, viewport-fit=cover"}],["$","meta","1",{"name":"theme-color","content":"#302e2b"}]]
a:[["$","meta","0",{"charSet":"utf-8"}],["$","title","1",{"children":"How to analyse your own chess games (a routine that actually works) · Fast Chess Analyzer"}],["$","meta","2",{"name":"description","content":"Most players run an engine, nod at the red marks, and learn nothing. Here is a repeatable routine that turns one game into one concrete lesson."}],["$","meta","3",{"name":"application-name","content":"Fast Chess Analyzer"}],["$","link","4",{"rel":"manifest","href":"/manifest.webmanifest","crossOrigin":"$undefined"}],["$","link","5",{"rel":"canonical","href":"https://chess-analyzer-ruddy.vercel.app/blog/how-to-analyze-your-own-chess-games"}],["$","meta","6",{"name":"mobile-web-app-capable","content":"yes"}],["$","meta","7",{"name":"apple-mobile-web-app-title","content":"Chess Analyzer"}],["$","meta","8",{"name":"apple-mobile-web-app-status-bar-style","content":"black-translucent"}],["$","meta","9",{"property":"og:title","content":"How to analyse your own chess games (a routine that actually works)"}],["$","meta","10",{"property":"og:description","content":"Most players run an engine, nod at the red marks, and learn nothing. Here is a repeatable routine that turns one game into one concrete lesson."}],["$","meta","11",{"property":"og:url","content":"https://chess-analyzer-ruddy.vercel.app/blog/how-to-analyze-your-own-chess-games"}],["$","meta","12",{"property":"og:type","content":"article"}],["$","meta","13",{"property":"article:published_time","content":"2026-08-01T09:00:00.000Z"}],["$","meta","14",{"property":"article:tag","content":"improvement"}],["$","meta","15",{"property":"article:tag","content":"analysis"}],["$","meta","16",{"name":"twitter:card","content":"summary"}],["$","meta","17",{"name":"twitter:title","content":"How to analyse your own chess games (a routine that actually works)"}],["$","meta","18",{"name":"twitter:description","content":"Most players run an engine, nod at the red marks, and learn nothing. Here is a repeatable routine that turns one game into one concrete lesson."}],["$","link","19",{"rel":"icon","href":"/icons/favicon-32.png","sizes":"32x32","type":"image/png"}],["$","link","20",{"rel":"icon","href":"/icons/favicon-16.png","sizes":"16x16","type":"image/png"}],["$","link","21",{"rel":"apple-touch-icon","href":"/icons/apple-touch-icon.png"}]]
8:null
