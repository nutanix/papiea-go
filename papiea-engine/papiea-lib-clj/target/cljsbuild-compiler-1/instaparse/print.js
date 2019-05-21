// Compiled by ClojureScript 1.10.439 {:target :nodejs}
goog.provide('instaparse.print');
goog.require('cljs.core');
goog.require('clojure.string');
instaparse.print.paren_for_tags = (function instaparse$print$paren_for_tags(tag_set,hidden_QMARK_,parser){
if(cljs.core.truth_((function (){var and__4036__auto__ = cljs.core.not.call(null,hidden_QMARK_);
if(and__4036__auto__){
return tag_set.call(null,parser.call(null,new cljs.core.Keyword(null,"tag","tag",-1290361223)));
} else {
return and__4036__auto__;
}
})())){
return ["(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.combinators__GT_str.call(null,parser,false)),")"].join('');
} else {
return instaparse.print.combinators__GT_str.call(null,parser,false);
}
});
instaparse.print.paren_for_compound = cljs.core.partial.call(null,instaparse.print.paren_for_tags,new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"cat","cat",-1457810207),null,new cljs.core.Keyword(null,"ord","ord",1142548323),null,new cljs.core.Keyword(null,"alt","alt",-3214426),null], null), null));
/**
 * Replaces whitespace characters with escape sequences for better printing
 */
instaparse.print.regexp_replace = (function instaparse$print$regexp_replace(s){
var G__7208 = s;
switch (G__7208) {
case "\n":
return "\\n";

break;
case "\b":
return "\\b";

break;
case "\f":
return "\\f";

break;
case "\r":
return "\\r";

break;
case "\t":
return "\\t";

break;
default:
return s;

}
});
instaparse.print.regexp__GT_str = (function instaparse$print$regexp__GT_str(r){
return clojure.string.replace.call(null,["#\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.subs.call(null,r.source,(1))),"\""].join(''),/[\s]/,instaparse.print.regexp_replace);
});
instaparse.print.number__GT_hex_padded = (function instaparse$print$number__GT_hex_padded(n){
if((n <= (4095))){
return ["0000",cljs.core.str.cljs$core$IFn$_invoke$arity$1(n.toString((16)))].join('').substr((-4));
} else {
return n.toString((16));
}
});

instaparse.print.char_range__GT_str = (function instaparse$print$char_range__GT_str(p__7210){
var map__7211 = p__7210;
var map__7211__$1 = (((((!((map__7211 == null))))?(((((map__7211.cljs$lang$protocol_mask$partition0$ & (64))) || ((cljs.core.PROTOCOL_SENTINEL === map__7211.cljs$core$ISeq$))))?true:false):false))?cljs.core.apply.call(null,cljs.core.hash_map,map__7211):map__7211);
var lo = cljs.core.get.call(null,map__7211__$1,new cljs.core.Keyword(null,"lo","lo",-931799889));
var hi = cljs.core.get.call(null,map__7211__$1,new cljs.core.Keyword(null,"hi","hi",-1821422114));
if(cljs.core._EQ_.call(null,lo,hi)){
return ["%x",cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.number__GT_hex_padded.call(null,lo))].join('');
} else {
return ["%x",cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.number__GT_hex_padded.call(null,lo)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.number__GT_hex_padded.call(null,hi))].join('');
}
});
/**
 * Stringifies a parser built from combinators
 */
instaparse.print.combinators__GT_str = (function instaparse$print$combinators__GT_str(var_args){
var G__7214 = arguments.length;
switch (G__7214) {
case 1:
return instaparse.print.combinators__GT_str.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return instaparse.print.combinators__GT_str.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

instaparse.print.combinators__GT_str.cljs$core$IFn$_invoke$arity$1 = (function (p){
return instaparse.print.combinators__GT_str.call(null,p,false);
});

instaparse.print.combinators__GT_str.cljs$core$IFn$_invoke$arity$2 = (function (p__7215,hidden_QMARK_){
var map__7216 = p__7215;
var map__7216__$1 = (((((!((map__7216 == null))))?(((((map__7216.cljs$lang$protocol_mask$partition0$ & (64))) || ((cljs.core.PROTOCOL_SENTINEL === map__7216.cljs$core$ISeq$))))?true:false):false))?cljs.core.apply.call(null,cljs.core.hash_map,map__7216):map__7216);
var p = map__7216__$1;
var parser = cljs.core.get.call(null,map__7216__$1,new cljs.core.Keyword(null,"parser","parser",-1543495310));
var parser1 = cljs.core.get.call(null,map__7216__$1,new cljs.core.Keyword(null,"parser1","parser1",-439601422));
var parser2 = cljs.core.get.call(null,map__7216__$1,new cljs.core.Keyword(null,"parser2","parser2",1013754688));
var parsers = cljs.core.get.call(null,map__7216__$1,new cljs.core.Keyword(null,"parsers","parsers",-804353827));
var tag = cljs.core.get.call(null,map__7216__$1,new cljs.core.Keyword(null,"tag","tag",-1290361223));
if(cljs.core.truth_((function (){var and__4036__auto__ = cljs.core.not.call(null,hidden_QMARK_);
if(and__4036__auto__){
return new cljs.core.Keyword(null,"hide","hide",-596913169).cljs$core$IFn$_invoke$arity$1(p);
} else {
return and__4036__auto__;
}
})())){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1("<"),cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.combinators__GT_str.call(null,p,true)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(">")].join('');
} else {
var G__7218 = tag;
var G__7218__$1 = (((G__7218 instanceof cljs.core.Keyword))?G__7218.fqn:null);
switch (G__7218__$1) {
case "epsilon":
return "\u03B5";

break;
case "opt":
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.paren_for_compound.call(null,hidden_QMARK_,parser)),"?"].join('');

break;
case "plus":
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.paren_for_compound.call(null,hidden_QMARK_,parser)),"+"].join('');

break;
case "star":
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.paren_for_compound.call(null,hidden_QMARK_,parser)),"*"].join('');

break;
case "rep":
if(cljs.core.not_EQ_.call(null,new cljs.core.Keyword(null,"min","min",444991522).cljs$core$IFn$_invoke$arity$1(p),new cljs.core.Keyword(null,"max","max",61366548).cljs$core$IFn$_invoke$arity$1(p))){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.paren_for_compound.call(null,hidden_QMARK_,parser)),cljs.core.str.cljs$core$IFn$_invoke$arity$1("{"),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"min","min",444991522).cljs$core$IFn$_invoke$arity$1(p)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(","),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"max","max",61366548).cljs$core$IFn$_invoke$arity$1(p)),cljs.core.str.cljs$core$IFn$_invoke$arity$1("}")].join('');
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.paren_for_compound.call(null,hidden_QMARK_,parser)),cljs.core.str.cljs$core$IFn$_invoke$arity$1("{"),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"min","min",444991522).cljs$core$IFn$_invoke$arity$1(p)),cljs.core.str.cljs$core$IFn$_invoke$arity$1("}")].join('');
}

break;
case "alt":
return clojure.string.join.call(null," | ",cljs.core.map.call(null,cljs.core.partial.call(null,instaparse.print.paren_for_tags,new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ord","ord",1142548323),null], null), null),hidden_QMARK_),parsers));

break;
case "ord":
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.paren_for_tags.call(null,new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"alt","alt",-3214426),null], null), null),hidden_QMARK_,parser1))," / ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.paren_for_tags.call(null,new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"alt","alt",-3214426),null], null), null),hidden_QMARK_,parser2))].join('');

break;
case "cat":
return clojure.string.join.call(null," ",cljs.core.map.call(null,cljs.core.partial.call(null,instaparse.print.paren_for_tags,new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ord","ord",1142548323),null,new cljs.core.Keyword(null,"alt","alt",-3214426),null], null), null),hidden_QMARK_),parsers));

break;
case "string":
var sb__4572__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__7219_7229 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__7220_7230 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__7221_7231 = true;
var _STAR_print_fn_STAR__temp_val__7222_7232 = ((function (_STAR_print_newline_STAR__orig_val__7219_7229,_STAR_print_fn_STAR__orig_val__7220_7230,_STAR_print_newline_STAR__temp_val__7221_7231,sb__4572__auto__,G__7218,G__7218__$1,map__7216,map__7216__$1,p,parser,parser1,parser2,parsers,tag){
return (function (x__4573__auto__){
return sb__4572__auto__.append(x__4573__auto__);
});})(_STAR_print_newline_STAR__orig_val__7219_7229,_STAR_print_fn_STAR__orig_val__7220_7230,_STAR_print_newline_STAR__temp_val__7221_7231,sb__4572__auto__,G__7218,G__7218__$1,map__7216,map__7216__$1,p,parser,parser1,parser2,parsers,tag))
;
cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__7221_7231;

cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__7222_7232;

try{cljs.core.pr.call(null,new cljs.core.Keyword(null,"string","string",-1989541586).cljs$core$IFn$_invoke$arity$1(p));
}finally {cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__7220_7230;

cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__7219_7229;
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__4572__auto__);

break;
case "string-ci":
var sb__4572__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__7223_7233 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__7224_7234 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__7225_7235 = true;
var _STAR_print_fn_STAR__temp_val__7226_7236 = ((function (_STAR_print_newline_STAR__orig_val__7223_7233,_STAR_print_fn_STAR__orig_val__7224_7234,_STAR_print_newline_STAR__temp_val__7225_7235,sb__4572__auto__,G__7218,G__7218__$1,map__7216,map__7216__$1,p,parser,parser1,parser2,parsers,tag){
return (function (x__4573__auto__){
return sb__4572__auto__.append(x__4573__auto__);
});})(_STAR_print_newline_STAR__orig_val__7223_7233,_STAR_print_fn_STAR__orig_val__7224_7234,_STAR_print_newline_STAR__temp_val__7225_7235,sb__4572__auto__,G__7218,G__7218__$1,map__7216,map__7216__$1,p,parser,parser1,parser2,parsers,tag))
;
cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__7225_7235;

cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__7226_7236;

try{cljs.core.pr.call(null,new cljs.core.Keyword(null,"string","string",-1989541586).cljs$core$IFn$_invoke$arity$1(p));
}finally {cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__7224_7234;

cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__7223_7233;
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__4572__auto__);

break;
case "char":
return instaparse.print.char_range__GT_str.call(null,p);

break;
case "regexp":
return instaparse.print.regexp__GT_str.call(null,new cljs.core.Keyword(null,"regexp","regexp",-541372782).cljs$core$IFn$_invoke$arity$1(p));

break;
case "nt":
return cljs.core.subs.call(null,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"keyword","keyword",811389747).cljs$core$IFn$_invoke$arity$1(p)),(1));

break;
case "look":
return ["&",cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.paren_for_compound.call(null,hidden_QMARK_,parser))].join('');

break;
case "neg":
return ["!",cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.paren_for_compound.call(null,hidden_QMARK_,parser))].join('');

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__7218__$1)].join('')));

}
}
});

instaparse.print.combinators__GT_str.cljs$lang$maxFixedArity = 2;

/**
 * Takes a non-terminal symbol and a parser built from combinators,
 * and returns a string for the rule.
 */
instaparse.print.rule__GT_str = (function instaparse$print$rule__GT_str(non_terminal,parser){
if(cljs.core._EQ_.call(null,new cljs.core.Keyword(null,"reduction-type","reduction-type",-488293450).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"red","red",-969428204).cljs$core$IFn$_invoke$arity$1(parser)),new cljs.core.Keyword(null,"raw","raw",1604651272))){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1("<"),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.name.call(null,non_terminal)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(">")," = ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.combinators__GT_str.call(null,parser))].join('');
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.name.call(null,non_terminal))," = ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(instaparse.print.combinators__GT_str.call(null,parser))].join('');
}
});
/**
 * Takes a Parser object, i.e., something with a grammar map and a start 
 * production keyword, and stringifies it.
 */
instaparse.print.Parser__GT_str = (function instaparse$print$Parser__GT_str(p__7237){
var map__7238 = p__7237;
var map__7238__$1 = (((((!((map__7238 == null))))?(((((map__7238.cljs$lang$protocol_mask$partition0$ & (64))) || ((cljs.core.PROTOCOL_SENTINEL === map__7238.cljs$core$ISeq$))))?true:false):false))?cljs.core.apply.call(null,cljs.core.hash_map,map__7238):map__7238);
var grammar = cljs.core.get.call(null,map__7238__$1,new cljs.core.Keyword(null,"grammar","grammar",1881328267));
var start = cljs.core.get.call(null,map__7238__$1,new cljs.core.Keyword(null,"start-production","start-production",687546537));
return clojure.string.join.call(null,"\n",cljs.core.cons.call(null,instaparse.print.rule__GT_str.call(null,start,grammar.call(null,start)),(function (){var iter__4434__auto__ = ((function (map__7238,map__7238__$1,grammar,start){
return (function instaparse$print$Parser__GT_str_$_iter__7240(s__7241){
return (new cljs.core.LazySeq(null,((function (map__7238,map__7238__$1,grammar,start){
return (function (){
var s__7241__$1 = s__7241;
while(true){
var temp__5457__auto__ = cljs.core.seq.call(null,s__7241__$1);
if(temp__5457__auto__){
var s__7241__$2 = temp__5457__auto__;
if(cljs.core.chunked_seq_QMARK_.call(null,s__7241__$2)){
var c__4432__auto__ = cljs.core.chunk_first.call(null,s__7241__$2);
var size__4433__auto__ = cljs.core.count.call(null,c__4432__auto__);
var b__7243 = cljs.core.chunk_buffer.call(null,size__4433__auto__);
if((function (){var i__7242 = (0);
while(true){
if((i__7242 < size__4433__auto__)){
var vec__7244 = cljs.core._nth.call(null,c__4432__auto__,i__7242);
var non_terminal = cljs.core.nth.call(null,vec__7244,(0),null);
var parser = cljs.core.nth.call(null,vec__7244,(1),null);
if(cljs.core.not_EQ_.call(null,non_terminal,start)){
cljs.core.chunk_append.call(null,b__7243,instaparse.print.rule__GT_str.call(null,non_terminal,parser));

var G__7250 = (i__7242 + (1));
i__7242 = G__7250;
continue;
} else {
var G__7251 = (i__7242 + (1));
i__7242 = G__7251;
continue;
}
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons.call(null,cljs.core.chunk.call(null,b__7243),instaparse$print$Parser__GT_str_$_iter__7240.call(null,cljs.core.chunk_rest.call(null,s__7241__$2)));
} else {
return cljs.core.chunk_cons.call(null,cljs.core.chunk.call(null,b__7243),null);
}
} else {
var vec__7247 = cljs.core.first.call(null,s__7241__$2);
var non_terminal = cljs.core.nth.call(null,vec__7247,(0),null);
var parser = cljs.core.nth.call(null,vec__7247,(1),null);
if(cljs.core.not_EQ_.call(null,non_terminal,start)){
return cljs.core.cons.call(null,instaparse.print.rule__GT_str.call(null,non_terminal,parser),instaparse$print$Parser__GT_str_$_iter__7240.call(null,cljs.core.rest.call(null,s__7241__$2)));
} else {
var G__7252 = cljs.core.rest.call(null,s__7241__$2);
s__7241__$1 = G__7252;
continue;
}
}
} else {
return null;
}
break;
}
});})(map__7238,map__7238__$1,grammar,start))
,null,null));
});})(map__7238,map__7238__$1,grammar,start))
;
return iter__4434__auto__.call(null,grammar);
})()));
});

//# sourceMappingURL=print.js.map
