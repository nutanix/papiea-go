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
var G__4803 = (line + (1));
var G__4804 = (1);
var G__4805 = (counter + (1));
line = G__4803;
col = G__4804;
counter = G__4805;
continue;
} else {
var G__4806 = line;
var G__4807 = (col + (1));
var G__4808 = (counter + (1));
line = G__4806;
col = G__4807;
counter = G__4808;
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
var G__4809 = cljs.core.next.call(null,chars);
var G__4810 = (n__$1 - (1));
chars = G__4809;
n__$1 = G__4810;
continue;
} else {
var G__4811 = cljs.core.next.call(null,chars);
var G__4812 = n__$1;
chars = G__4811;
n__$1 = G__4812;
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
instaparse.failure.pprint_failure = (function instaparse$failure$pprint_failure(p__4813){
var map__4814 = p__4813;
var map__4814__$1 = (((((!((map__4814 == null))))?(((((map__4814.cljs$lang$protocol_mask$partition0$ & (64))) || ((cljs.core.PROTOCOL_SENTINEL === map__4814.cljs$core$ISeq$))))?true:false):false))?cljs.core.apply.call(null,cljs.core.hash_map,map__4814):map__4814);
var line = cljs.core.get.call(null,map__4814__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column = cljs.core.get.call(null,map__4814__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var text = cljs.core.get.call(null,map__4814__$1,new cljs.core.Keyword(null,"text","text",-1790561697));
var reason = cljs.core.get.call(null,map__4814__$1,new cljs.core.Keyword(null,"reason","reason",-2070751759));
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

var seq__4816_4824 = cljs.core.seq.call(null,full_reasons);
var chunk__4817_4825 = null;
var count__4818_4826 = (0);
var i__4819_4827 = (0);
while(true){
if((i__4819_4827 < count__4818_4826)){
var r_4828 = cljs.core._nth.call(null,chunk__4817_4825,i__4819_4827);
instaparse.failure.print_reason.call(null,r_4828);

cljs.core.println.call(null," (followed by end-of-string)");


var G__4829 = seq__4816_4824;
var G__4830 = chunk__4817_4825;
var G__4831 = count__4818_4826;
var G__4832 = (i__4819_4827 + (1));
seq__4816_4824 = G__4829;
chunk__4817_4825 = G__4830;
count__4818_4826 = G__4831;
i__4819_4827 = G__4832;
continue;
} else {
var temp__5457__auto___4833 = cljs.core.seq.call(null,seq__4816_4824);
if(temp__5457__auto___4833){
var seq__4816_4834__$1 = temp__5457__auto___4833;
if(cljs.core.chunked_seq_QMARK_.call(null,seq__4816_4834__$1)){
var c__4461__auto___4835 = cljs.core.chunk_first.call(null,seq__4816_4834__$1);
var G__4836 = cljs.core.chunk_rest.call(null,seq__4816_4834__$1);
var G__4837 = c__4461__auto___4835;
var G__4838 = cljs.core.count.call(null,c__4461__auto___4835);
var G__4839 = (0);
seq__4816_4824 = G__4836;
chunk__4817_4825 = G__4837;
count__4818_4826 = G__4838;
i__4819_4827 = G__4839;
continue;
} else {
var r_4840 = cljs.core.first.call(null,seq__4816_4834__$1);
instaparse.failure.print_reason.call(null,r_4840);

cljs.core.println.call(null," (followed by end-of-string)");


var G__4841 = cljs.core.next.call(null,seq__4816_4834__$1);
var G__4842 = null;
var G__4843 = (0);
var G__4844 = (0);
seq__4816_4824 = G__4841;
chunk__4817_4825 = G__4842;
count__4818_4826 = G__4843;
i__4819_4827 = G__4844;
continue;
}
} else {
}
}
break;
}

var seq__4820 = cljs.core.seq.call(null,partial_reasons);
var chunk__4821 = null;
var count__4822 = (0);
var i__4823 = (0);
while(true){
if((i__4823 < count__4822)){
var r = cljs.core._nth.call(null,chunk__4821,i__4823);
instaparse.failure.print_reason.call(null,r);

cljs.core.println.call(null);


var G__4845 = seq__4820;
var G__4846 = chunk__4821;
var G__4847 = count__4822;
var G__4848 = (i__4823 + (1));
seq__4820 = G__4845;
chunk__4821 = G__4846;
count__4822 = G__4847;
i__4823 = G__4848;
continue;
} else {
var temp__5457__auto__ = cljs.core.seq.call(null,seq__4820);
if(temp__5457__auto__){
var seq__4820__$1 = temp__5457__auto__;
if(cljs.core.chunked_seq_QMARK_.call(null,seq__4820__$1)){
var c__4461__auto__ = cljs.core.chunk_first.call(null,seq__4820__$1);
var G__4849 = cljs.core.chunk_rest.call(null,seq__4820__$1);
var G__4850 = c__4461__auto__;
var G__4851 = cljs.core.count.call(null,c__4461__auto__);
var G__4852 = (0);
seq__4820 = G__4849;
chunk__4821 = G__4850;
count__4822 = G__4851;
i__4823 = G__4852;
continue;
} else {
var r = cljs.core.first.call(null,seq__4820__$1);
instaparse.failure.print_reason.call(null,r);

cljs.core.println.call(null);


var G__4853 = cljs.core.next.call(null,seq__4820__$1);
var G__4854 = null;
var G__4855 = (0);
var G__4856 = (0);
seq__4820 = G__4853;
chunk__4821 = G__4854;
count__4822 = G__4855;
i__4823 = G__4856;
continue;
}
} else {
return null;
}
}
break;
}
});
