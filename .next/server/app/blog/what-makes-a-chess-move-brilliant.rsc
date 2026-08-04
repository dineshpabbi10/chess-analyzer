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
0:{"P":null,"b":"hkHQt7Tew7iCENazW-7-4","p":"","c":["","blog","what-makes-a-chess-move-brilliant"],"i":false,"f":[[["",{"children":["blog",{"children":[["slug","what-makes-a-chess-move-brilliant","d"],{"children":["__PAGE__",{}]}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/b6cc6d016dc47b87.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","children":["$","body",null,{"children":[["$","$L2",null,{"children":["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[[],[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":404}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]]],"forbidden":"$undefined","unauthorized":"$undefined"}]}],["$","$L5",null,{}]]}]}]]}],{"children":["blog",["$","$1","c",{"children":[null,["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children","blog","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":[["slug","what-makes-a-chess-move-brilliant","d"],["$","$1","c",{"children":[null,["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children","blog","children","$0:f:0:1:2:children:2:children:0","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":["$L6",null,["$","$L7",null,{"children":"$L8"}]]}],{},null,false]},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","pUa9LEEyUcpgmc0clLu4-",{"children":[["$","$L9",null,{"children":"$La"}],["$","$Lb",null,{"children":"$Lc"}],null]}]]}],false]],"m":"$undefined","G":["$d","$undefined"],"s":false,"S":true}
f:I[8173,["173","static/chunks/173-e936e38b90331b66.js","657","static/chunks/657-01b42027f65cf1be.js","953","static/chunks/app/blog/%5Bslug%5D/page-bc9953dbda7b0d47.js"],""]
e:T1396,<p>Game reports label every move: <strong>Best</strong>, <strong>Excellent</strong>, <strong>Good</strong>, <strong>Inaccuracy</strong>,
<strong>Mistake</strong>, <strong>Blunder</strong> — plus the special ones, <strong>Brilliant</strong> and <strong>Great</strong>.
Those last two are the ones people care about, and the ones nobody explains.</p>
<p>Here&#39;s how the classification actually works.</p>
<h2>Most labels are just one number</h2>
<p>The ordinary labels come almost entirely from a single quantity: <strong>how much win
probability did this move give away?</strong></p>
<table>
<thead>
<tr>
<th>Win probability lost</th>
<th>Typical label</th>
</tr>
</thead>
<tbody><tr>
<td>~0, and it was the engine&#39;s top choice</td>
<td>Best</td>
</tr>
<tr>
<td>under ~2%</td>
<td>Excellent</td>
</tr>
<tr>
<td>under ~5%</td>
<td>Good</td>
</tr>
<tr>
<td>under ~10%</td>
<td>Inaccuracy</td>
</tr>
<tr>
<td>under ~20%</td>
<td>Mistake</td>
</tr>
<tr>
<td>more</td>
<td>Blunder</td>
</tr>
</tbody></table>
<p>That&#39;s it. No judgement about style, no understanding of your plan. A quiet
developing move and a brilliant defensive resource both land in &quot;Best&quot; if they
don&#39;t lose anything.</p>
<p>There&#39;s also <strong>Book</strong>, which just means &quot;this is known opening theory&quot; — the
engine isn&#39;t grading you yet.</p>
<h2>Brilliant needs a sacrifice</h2>
<p>A move gets called <strong>Brilliant</strong> when it does something that looks wrong and
isn&#39;t. Concretely, most implementations require roughly:</p>
<ol>
<li><strong>You gave up material.</strong> Not a trade — a genuine investment, typically a piece
or more of net material.</li>
<li><strong>It&#39;s still good.</strong> The move is among the engine&#39;s best, and the position after
it is at least holding.</li>
<li><strong>You weren&#39;t already completely winning.</strong> If you&#39;re up a queen, throwing a
knight away is a flourish, not a brilliancy.</li>
<li><strong>You aren&#39;t simply lost.</strong> A desperate sacrifice in a hopeless position is not
brilliant, however pretty.</li>
</ol>
<p>That combination — <em>material down, evaluation fine</em> — is what makes a move feel
brilliant to a human. You have to see further than the material count to justify
it.</p>
<h2>Great is about being the only move</h2>
<p><strong>Great</strong> is a different idea: it&#39;s not about sacrifice, it&#39;s about <strong>scarcity</strong>.</p>
<p>A move is Great when it&#39;s essentially the <em>only</em> move that holds the position —
the second-best option is dramatically worse. This is why an engine needs to search
more than one line to detect it: you have to know what the alternatives were worth
before you can say the best move was uniquely good.</p>
<p>Finding a Great move means you spotted the one narrow path. Finding a Best move in
a position with five reasonable options is much easier, even though both keep the
evaluation.</p>
<h2>Miss is the mirror image of a blunder</h2>
<p><strong>Miss</strong> deserves a mention because it&#39;s the most useful label for improvement.
It doesn&#39;t mean you played a bad move in a bad position — it means you had
something genuinely winning available, often a mate, and let most of it slip.</p>
<p>Blunders lose games you were fine in. Misses lose games you should have won. If
your report is full of Misses, your problem isn&#39;t defence — it&#39;s conversion.</p>
<h2>Why tools disagree</h2>
<p>Two reports on the same game can label the same move differently, for reasons that
are all defensible:</p>
<ul>
<li><strong>Search depth.</strong> A deeper search may find that your &quot;brilliant&quot; sacrifice was
actually just losing — or that a move you thought was fine was the only move.</li>
<li><strong>Sacrifice thresholds.</strong> How much material must you shed? Does a pawn count? Is
a temporary sacrifice that&#39;s immediately regained still a sacrifice?</li>
<li><strong>Whether &quot;only move&quot; is checked at all.</strong> Detecting Great requires multi-line
analysis, which is more expensive, so some tools skip it.</li>
<li><strong>Book cut-off.</strong> How long is a move still &quot;theory&quot; rather than graded?</li>
</ul>
<p>None of these have a single right answer — which is worth remembering the next time
a tool declines to award you the brilliancy you feel you earned.</p>
<h2>Reading the labels usefully</h2>
<p>The labels are a <em>summary</em>, not a verdict. What matters is the shape of them:</p>
<ul>
<li>Lots of <strong>Inaccuracies</strong>, few blunders → you understand the game but drift.</li>
<li>Few inaccuracies, occasional <strong>Blunders</strong> → tactics or concentration.</li>
<li>Several <strong>Misses</strong> → you&#39;re creating chances and not taking them.</li>
</ul>
<p>Curious how your own games break down? <a href="/">Run a game review</a>, or read our
<a href="/blog/how-to-analyze-your-own-chess-games">routine for analysing your own games</a>.</p>
6:["$","div",null,{"className":"page","children":["$","div",null,{"className":"page-main","children":[["$","h1",null,{"className":"page-title","children":"What makes a chess move \"brilliant\"?"}],["$","p",null,{"className":"page-sub","children":"Brilliant, Great, Best, Excellent — where the labels in a game report come from, and why two tools can disagree about the same move."}],[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"What makes a chess move \\\"brilliant\\\"?\",\"description\":\"Brilliant, Great, Best, Excellent — where the labels in a game report come from, and why two tools can disagree about the same move.\",\"datePublished\":\"2026-08-03T09:00:00.000Z\",\"dateModified\":\"2026-08-03T09:00:00.000Z\",\"mainEntityOfPage\":\"https://chess-analyzer-ruddy.vercel.app/blog/what-makes-a-chess-move-brilliant\",\"author\":{\"@type\":\"Organization\",\"name\":\"Fast Chess Analyzer\"},\"publisher\":{\"@type\":\"Organization\",\"name\":\"Fast Chess Analyzer\"}}"}}],["$","div",null,{"className":"post-meta","children":[["$","time",null,{"dateTime":"2026-08-03T09:00:00.000Z","children":"3 August 2026"}],["$","span",null,{"children":"·"}],["$","span",null,{"children":[3," min read"]}]]}],["$","article",null,{"className":"prose","dangerouslySetInnerHTML":{"__html":"$e"}}],["$","div",null,{"className":"post-foot","children":[["$","$Lf",null,{"href":"/blog","className":"link","children":"← All posts"}],["$","$Lf",null,{"href":"/","className":"primary btn-link","children":"Review one of your games"}]]}]]]}]}]
c:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1, viewport-fit=cover"}],["$","meta","1",{"name":"theme-color","content":"#302e2b"}]]
a:[["$","meta","0",{"charSet":"utf-8"}],["$","title","1",{"children":"What makes a chess move \"brilliant\"? · Fast Chess Analyzer"}],["$","meta","2",{"name":"description","content":"Brilliant, Great, Best, Excellent — where the labels in a game report come from, and why two tools can disagree about the same move."}],["$","meta","3",{"name":"application-name","content":"Fast Chess Analyzer"}],["$","link","4",{"rel":"manifest","href":"/manifest.webmanifest","crossOrigin":"$undefined"}],["$","link","5",{"rel":"canonical","href":"https://chess-analyzer-ruddy.vercel.app/blog/what-makes-a-chess-move-brilliant"}],["$","meta","6",{"name":"mobile-web-app-capable","content":"yes"}],["$","meta","7",{"name":"apple-mobile-web-app-title","content":"Chess Analyzer"}],["$","meta","8",{"name":"apple-mobile-web-app-status-bar-style","content":"black-translucent"}],["$","meta","9",{"property":"og:title","content":"What makes a chess move \"brilliant\"?"}],["$","meta","10",{"property":"og:description","content":"Brilliant, Great, Best, Excellent — where the labels in a game report come from, and why two tools can disagree about the same move."}],["$","meta","11",{"property":"og:url","content":"https://chess-analyzer-ruddy.vercel.app/blog/what-makes-a-chess-move-brilliant"}],["$","meta","12",{"property":"og:type","content":"article"}],["$","meta","13",{"property":"article:published_time","content":"2026-08-03T09:00:00.000Z"}],["$","meta","14",{"property":"article:tag","content":"analysis"}],["$","meta","15",{"property":"article:tag","content":"engine"}],["$","meta","16",{"name":"twitter:card","content":"summary"}],["$","meta","17",{"name":"twitter:title","content":"What makes a chess move \"brilliant\"?"}],["$","meta","18",{"name":"twitter:description","content":"Brilliant, Great, Best, Excellent — where the labels in a game report come from, and why two tools can disagree about the same move."}],["$","link","19",{"rel":"icon","href":"/icons/favicon-32.png","sizes":"32x32","type":"image/png"}],["$","link","20",{"rel":"icon","href":"/icons/favicon-16.png","sizes":"16x16","type":"image/png"}],["$","link","21",{"rel":"apple-touch-icon","href":"/icons/apple-touch-icon.png"}]]
8:null
