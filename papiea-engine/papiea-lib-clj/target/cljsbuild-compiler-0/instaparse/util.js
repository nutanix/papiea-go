// Compiled by ClojureScript 1.10.439 {:target :nodejs}
goog.provide('instaparse.util');
goog.require('cljs.core');
instaparse.util.throw_runtime_exception = (function instaparse$util$throw_runtime_exception(var_args){
var args__4647__auto__ = [];
var len__4641__auto___4860 = arguments.length;
var i__4642__auto___4861 = (0);
while(true){
if((i__4642__auto___4861 < len__4641__auto___4860)){
args__4647__auto__.push((arguments[i__4642__auto___4861]));

var G__4862 = (i__4642__auto___4861 + (1));
i__4642__auto___4861 = G__4862;
continue;
} else {
}
break;
}

var argseq__4648__auto__ = ((((0) < args__4647__auto__.length))?(new cljs.core.IndexedSeq(args__4647__auto__.slice((0)),(0),null)):null);
return instaparse.util.throw_runtime_exception.cljs$core$IFn$_invoke$arity$variadic(argseq__4648__auto__);
});

instaparse.util.throw_runtime_exception.cljs$core$IFn$_invoke$arity$variadic = (function (message){
throw cljs.core.apply.call(null,cljs.core.str,message);
});

instaparse.util.throw_runtime_exception.cljs$lang$maxFixedArity = (0);

/** @this {Function} */
instaparse.util.throw_runtime_exception.cljs$lang$applyTo = (function (seq4859){
var self__4629__auto__ = this;
return self__4629__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq.call(null,seq4859));
});

instaparse.util.throw_illegal_argument_exception = (function instaparse$util$throw_illegal_argument_exception(var_args){
var args__4647__auto__ = [];
var len__4641__auto___4864 = arguments.length;
var i__4642__auto___4865 = (0);
while(true){
if((i__4642__auto___4865 < len__4641__auto___4864)){
args__4647__auto__.push((arguments[i__4642__auto___4865]));

var G__4866 = (i__4642__auto___4865 + (1));
i__4642__auto___4865 = G__4866;
continue;
} else {
}
break;
}

var argseq__4648__auto__ = ((((0) < args__4647__auto__.length))?(new cljs.core.IndexedSeq(args__4647__auto__.slice((0)),(0),null)):null);
return instaparse.util.throw_illegal_argument_exception.cljs$core$IFn$_invoke$arity$variadic(argseq__4648__auto__);
});

instaparse.util.throw_illegal_argument_exception.cljs$core$IFn$_invoke$arity$variadic = (function (message){
throw cljs.core.apply.call(null,cljs.core.str,message);
});

instaparse.util.throw_illegal_argument_exception.cljs$lang$maxFixedArity = (0);

/** @this {Function} */
instaparse.util.throw_illegal_argument_exception.cljs$lang$applyTo = (function (seq4863){
var self__4629__auto__ = this;
return self__4629__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq.call(null,seq4863));
});

instaparse.util.regexp_flags = (function instaparse$util$regexp_flags(re){
var G__4867 = "";
var G__4867__$1 = (cljs.core.truth_(re.ignoreCase)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__4867),"i"].join(''):G__4867);
var G__4867__$2 = (cljs.core.truth_(re.multiline)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__4867__$1),"m"].join(''):G__4867__$1);
if(cljs.core.truth_(re.unicode)){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__4867__$2),"u"].join('');
} else {
return G__4867__$2;
}
});
