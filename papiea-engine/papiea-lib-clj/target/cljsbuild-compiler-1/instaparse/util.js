// Compiled by ClojureScript 1.10.439 {:target :nodejs}
goog.provide('instaparse.util');
goog.require('cljs.core');
instaparse.util.throw_runtime_exception = (function instaparse$util$throw_runtime_exception(var_args){
var args__4647__auto__ = [];
var len__4641__auto___7312 = arguments.length;
var i__4642__auto___7313 = (0);
while(true){
if((i__4642__auto___7313 < len__4641__auto___7312)){
args__4647__auto__.push((arguments[i__4642__auto___7313]));

var G__7314 = (i__4642__auto___7313 + (1));
i__4642__auto___7313 = G__7314;
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
instaparse.util.throw_runtime_exception.cljs$lang$applyTo = (function (seq7311){
var self__4629__auto__ = this;
return self__4629__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq.call(null,seq7311));
});

instaparse.util.throw_illegal_argument_exception = (function instaparse$util$throw_illegal_argument_exception(var_args){
var args__4647__auto__ = [];
var len__4641__auto___7316 = arguments.length;
var i__4642__auto___7317 = (0);
while(true){
if((i__4642__auto___7317 < len__4641__auto___7316)){
args__4647__auto__.push((arguments[i__4642__auto___7317]));

var G__7318 = (i__4642__auto___7317 + (1));
i__4642__auto___7317 = G__7318;
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
instaparse.util.throw_illegal_argument_exception.cljs$lang$applyTo = (function (seq7315){
var self__4629__auto__ = this;
return self__4629__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq.call(null,seq7315));
});

instaparse.util.regexp_flags = (function instaparse$util$regexp_flags(re){
var G__7319 = "";
var G__7319__$1 = (cljs.core.truth_(re.ignoreCase)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__7319),"i"].join(''):G__7319);
var G__7319__$2 = (cljs.core.truth_(re.multiline)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__7319__$1),"m"].join(''):G__7319__$1);
if(cljs.core.truth_(re.unicode)){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__7319__$2),"u"].join('');
} else {
return G__7319__$2;
}
});

//# sourceMappingURL=util.js.map
