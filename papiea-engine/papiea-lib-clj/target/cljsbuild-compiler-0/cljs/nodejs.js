// Compiled by ClojureScript 1.10.439 {:target :nodejs}
goog.provide('cljs.nodejs');
goog.require('cljs.core');
cljs.nodejs.require = require;
cljs.nodejs.process = process;
cljs.nodejs.enable_util_print_BANG_ = (function cljs$nodejs$enable_util_print_BANG_(){
cljs.core._STAR_print_newline_STAR_ = false;

cljs.core.set_print_fn_BANG_.call(null,(function() { 
var G__6366__delegate = function (args){
return console.log.apply(console,cljs.core.into_array.call(null,args));
};
var G__6366 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__6367__i = 0, G__6367__a = new Array(arguments.length -  0);
while (G__6367__i < G__6367__a.length) {G__6367__a[G__6367__i] = arguments[G__6367__i + 0]; ++G__6367__i;}
  args = new cljs.core.IndexedSeq(G__6367__a,0,null);
} 
return G__6366__delegate.call(this,args);};
G__6366.cljs$lang$maxFixedArity = 0;
G__6366.cljs$lang$applyTo = (function (arglist__6368){
var args = cljs.core.seq(arglist__6368);
return G__6366__delegate(args);
});
G__6366.cljs$core$IFn$_invoke$arity$variadic = G__6366__delegate;
return G__6366;
})()
);

cljs.core.set_print_err_fn_BANG_.call(null,(function() { 
var G__6369__delegate = function (args){
return console.error.apply(console,cljs.core.into_array.call(null,args));
};
var G__6369 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__6370__i = 0, G__6370__a = new Array(arguments.length -  0);
while (G__6370__i < G__6370__a.length) {G__6370__a[G__6370__i] = arguments[G__6370__i + 0]; ++G__6370__i;}
  args = new cljs.core.IndexedSeq(G__6370__a,0,null);
} 
return G__6369__delegate.call(this,args);};
G__6369.cljs$lang$maxFixedArity = 0;
G__6369.cljs$lang$applyTo = (function (arglist__6371){
var args = cljs.core.seq(arglist__6371);
return G__6369__delegate(args);
});
G__6369.cljs$core$IFn$_invoke$arity$variadic = G__6369__delegate;
return G__6369;
})()
);

return null;
});
