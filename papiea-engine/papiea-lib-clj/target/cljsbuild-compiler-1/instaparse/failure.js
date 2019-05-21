// Compiled by ClojureScript 1.10.439 {:target :nodejs}
goog.provide('instaparse.failure');
goog.require('cljs.core');
goog.require('instaparse.print');
/**
 * Takes an index into text, and determines the line and column info
 */
instaparse.failure.index__GT_line_column = (function instaparse$failure$index__GT_line_column(index,text){
var line = (1);
var col = (1);
var counter = (0);
while(true){
if(cljs.core._EQ_.call(null,index,counter)){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"line","line",212345235),line,new cljs.core.Keyword(null,"column","column",2078222095),col], null);
} else {
if(cljs.core._EQ_.call(null,"\n",cljs.core.get.call(null,text,counter))){
var G__7255 = (line + (1));
var G__7256 = (1);
var G__7257 = (counter + (1));
line = G__7255;
col = G__7256;
counter = G__7257;
continue;
} else {
var G__7258 = line;
var G__7259 = (col + (1));
var G__7260 = (counter + (1));
line = G__7258;
col = G__7259;
counter = G__7260;
continue;

}
}
break;
}
});
instaparse.failure.get_line = (function instaparse$failure$get_line(n,text){
var chars = cljs.core.seq.call(null,clojure.string.replace.call(null,text,"\r\n","\n"));
var n__$1 = n;
while(true){
if(cljs.core.empty_QMARK_.call(null,chars)){
return "";
} else {
if(cljs.core._EQ_.call(null,n__$1,(1))){
return cljs.core.apply.call(null,cljs.core.str,cljs.core.take_while.call(null,cljs.core.complement.call(null,new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["\n",null], null), null)),chars));
} else {
if(cljs.core._EQ_.call(null,"\n",cljs.core.first.call(null,chars))){
var G__7261 = cljs.core.next.call(null,chars);
var G__7262 = (n__$1 - (1));
chars = G__7261;
n__$1 = G__7262;
continue;
} else {
var G__7263 = cljs.core.next.call(null,chars);
var G__7264 = n__$1;
chars = G__7263;
n__$1 = G__7264;
continue;

}
}
}
break;
}
});
/**
 * Creates string with caret at nth position, 1-based
 */
instaparse.failure.marker = (function instaparse$failure$marker(n){
if(cljs.core.integer_QMARK_.call(null,n)){
if((n <= (1))){
return "^";
} else {
return cljs.core.apply.call(null,cljs.core.str,cljs.core.concat.call(null,cljs.core.repeat.call(null,(n - (1))," "),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["^"], null)));
}
} else {
return null;
}
});
/**
 * Adds text, line, and column info to failure object.
 */
instaparse.failure.augment_failure = (function instaparse$failure$augment_failure(failure,text){
var lc = instaparse.failure.index__GT_line_column.call(null,new cljs.core.Keyword(null,"index","index",-1531685915).cljs$core$IFn$_invoke$arity$1(failure),text);
return cljs.core.merge.call(null,failure,lc,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),instaparse.failure.get_line.call(null,new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(lc),text)], null));
});
/**
 * Provides special case for printing negative lookahead reasons
 */
instaparse.failure.print_reason = (function instaparse$failure$print_reason(r){
if(cljs.core.truth_(new cljs.core.Keyword(null,"NOT","NOT",-1689245341).cljs$core$IFn$_invoke$arity$1(r))){
cljs.core.print.call(null,"NOT ");

return cljs.core.print.call(null,new cljs.core.Keyword(null,"NOT","NOT",-1689245341).cljs$core$IFn$_invoke$arity$1(r));
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"char-range","char-range",1443391389).cljs$core$IFn$_invoke$arity$1(r))){
return cljs.core.print.call(null,instaparse.print.char_range__GT_str.call(null,r));
} else {
if((r instanceof RegExp)){
return cljs.core.print.call(null,instaparse.print.regexp__GT_str.call(null,r));
} else {
return cljs.core.pr.call(null,r);

}
}
}
});
/**
 * Takes an augmented failure object and prints the error message
 */
instaparse.failure.pprint_failure = (function instaparse$failure$pprint_failure(p__7265){
var map__7266 = p__7265;
var map__7266__$1 = (((((!((map__7266 == null))))?(((((map__7266.cljs$lang$protocol_mask$partition0$ & (64))) || ((cljs.core.PROTOCOL_SENTINEL === map__7266.cljs$core$ISeq$))))?true:false):false))?cljs.core.apply.call(null,cljs.core.hash_map,map__7266):map__7266);
var line = cljs.core.get.call(null,map__7266__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column = cljs.core.get.call(null,map__7266__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var text = cljs.core.get.call(null,map__7266__$1,new cljs.core.Keyword(null,"text","text",-1790561697));
var reason = cljs.core.get.call(null,map__7266__$1,new cljs.core.Keyword(null,"reason","reason",-2070751759));
cljs.core.println.call(null,["Parse error at line ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(line),", column ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column),":"].join(''));

cljs.core.println.call(null,text);

cljs.core.println.call(null,instaparse.failure.marker.call(null,column));

var full_reasons = cljs.core.distinct.call(null,cljs.core.map.call(null,new cljs.core.Keyword(null,"expecting","expecting",-57706705),cljs.core.filter.call(null,new cljs.core.Keyword(null,"full","full",436801220),reason)));
var partial_reasons = cljs.core.distinct.call(null,cljs.core.map.call(null,new cljs.core.Keyword(null,"expecting","expecting",-57706705),cljs.core.filter.call(null,cljs.core.complement.call(null,new cljs.core.Keyword(null,"full","full",436801220)),reason)));
var total = (cljs.core.count.call(null,full_reasons) + cljs.core.count.call(null,partial_reasons));
if((total === (0))){
} else {
if(cljs.core._EQ_.call(null,(1),total)){
cljs.core.println.call(null,"Expected:");
} else {
cljs.core.println.call(null,"Expected one of:");

}
}

var seq__7268_7276 = cljs.core.seq.call(null,full_reasons);
var chunk__7269_7277 = null;
var count__7270_7278 = (0);
var i__7271_7279 = (0);
while(true){
if((i__7271_7279 < count__7270_7278)){
var r_7280 = cljs.core._nth.call(null,chunk__7269_7277,i__7271_7279);
instaparse.failure.print_reason.call(null,r_7280);

cljs.core.println.call(null," (followed by end-of-string)");


var G__7281 = seq__7268_7276;
var G__7282 = chunk__7269_7277;
var G__7283 = count__7270_7278;
var G__7284 = (i__7271_7279 + (1));
seq__7268_7276 = G__7281;
chunk__7269_7277 = G__7282;
count__7270_7278 = G__7283;
i__7271_7279 = G__7284;
continue;
} else {
var temp__5457__auto___7285 = cljs.core.seq.call(null,seq__7268_7276);
if(temp__5457__auto___7285){
var seq__7268_7286__$1 = temp__5457__auto___7285;
if(cljs.core.chunked_seq_QMARK_.call(null,seq__7268_7286__$1)){
var c__4461__auto___7287 = cljs.core.chunk_first.call(null,seq__7268_7286__$1);
var G__7288 = cljs.core.chunk_rest.call(null,seq__7268_7286__$1);
var G__7289 = c__4461__auto___7287;
var G__7290 = cljs.core.count.call(null,c__4461__auto___7287);
var G__7291 = (0);
seq__7268_7276 = G__7288;
chunk__7269_7277 = G__7289;
count__7270_7278 = G__7290;
i__7271_7279 = G__7291;
continue;
} else {
var r_7292 = cljs.core.first.call(null,seq__7268_7286__$1);
instaparse.failure.print_reason.call(null,r_7292);

cljs.core.println.call(null," (followed by end-of-string)");


var G__7293 = cljs.core.next.call(null,seq__7268_7286__$1);
var G__7294 = null;
var G__7295 = (0);
var G__7296 = (0);
seq__7268_7276 = G__7293;
chunk__7269_7277 = G__7294;
count__7270_7278 = G__7295;
i__7271_7279 = G__7296;
continue;
}
} else {
}
}
break;
}

var seq__7272 = cljs.core.seq.call(null,partial_reasons);
var chunk__7273 = null;
var count__7274 = (0);
var i__7275 = (0);
while(true){
if((i__7275 < count__7274)){
var r = cljs.core._nth.call(null,chunk__7273,i__7275);
instaparse.failure.print_reason.call(null,r);

cljs.core.println.call(null);


var G__7297 = seq__7272;
var G__7298 = chunk__7273;
var G__7299 = count__7274;
var G__7300 = (i__7275 + (1));
seq__7272 = G__7297;
chunk__7273 = G__7298;
count__7274 = G__7299;
i__7275 = G__7300;
continue;
} else {
var temp__5457__auto__ = cljs.core.seq.call(null,seq__7272);
if(temp__5457__auto__){
var seq__7272__$1 = temp__5457__auto__;
if(cljs.core.chunked_seq_QMARK_.call(null,seq__7272__$1)){
var c__4461__auto__ = cljs.core.chunk_first.call(null,seq__7272__$1);
var G__7301 = cljs.core.chunk_rest.call(null,seq__7272__$1);
var G__7302 = c__4461__auto__;
var G__7303 = cljs.core.count.call(null,c__4461__auto__);
var G__7304 = (0);
seq__7272 = G__7301;
chunk__7273 = G__7302;
count__7274 = G__7303;
i__7275 = G__7304;
continue;
} else {
var r = cljs.core.first.call(null,seq__7272__$1);
instaparse.failure.print_reason.call(null,r);

cljs.core.println.call(null);


var G__7305 = cljs.core.next.call(null,seq__7272__$1);
var G__7306 = null;
var G__7307 = (0);
var G__7308 = (0);
seq__7272 = G__7305;
chunk__7273 = G__7306;
count__7274 = G__7307;
i__7275 = G__7308;
continue;
}
} else {
return null;
}
}
break;
}
});

//# sourceMappingURL=failure.js.map
