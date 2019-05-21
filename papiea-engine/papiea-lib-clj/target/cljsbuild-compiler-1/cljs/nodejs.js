// Compiled by ClojureScript 1.10.439 {:target :nodejs}
goog.provide('cljs.nodejs');
goog.require('cljs.core');
cljs.nodejs.require = require;
cljs.nodejs.process = process;
cljs.nodejs.enable_util_print_BANG_ = (function cljs$nodejs$enable_util_print_BANG_(){
cljs.core._STAR_print_newline_STAR_ = false;

cljs.core.set_print_fn_BANG_.call(null,(function() { 
var G__9727__delegate = function (args){
return console.log.apply(console,cljs.core.into_array.call(null,args));
};
var G__9727 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__9728__i = 0, G__9728__a = new Array(arguments.length -  0);
while (G__9728__i < G__9728__a.length) {G__9728__a[G__9728__i] = arguments[G__9728__i + 0]; ++G__9728__i;}
  args = new cljs.core.IndexedSeq(G__9728__a,0,null);
} 
return G__9727__delegate.call(this,args);};
G__9727.cljs$lang$maxFixedArity = 0;
G__9727.cljs$lang$applyTo = (function (arglist__9729){
var args = cljs.core.seq(arglist__9729);
return G__9727__delegate(args);
});
G__9727.cljs$core$IFn$_invoke$arity$variadic = G__9727__delegate;
return G__9727;
})()
);

cljs.core.set_print_err_fn_BANG_.call(null,(function() { 
var G__9730__delegate = function (args){
return console.error.apply(console,cljs.core.into_array.call(null,args));
};
var G__9730 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__9731__i = 0, G__9731__a = new Array(arguments.length -  0);
while (G__9731__i < G__9731__a.length) {G__9731__a[G__9731__i] = arguments[G__9731__i + 0]; ++G__9731__i;}
  args = new cljs.core.IndexedSeq(G__9731__a,0,null);
} 
return G__9730__delegate.call(this,args);};
G__9730.cljs$lang$maxFixedArity = 0;
G__9730.cljs$lang$applyTo = (function (arglist__9732){
var args = cljs.core.seq(arglist__9732);
return G__9730__delegate(args);
});
G__9730.cljs$core$IFn$_invoke$arity$variadic = G__9730__delegate;
return G__9730;
})()
);

return null;
});

//# sourceMappingURL=nodejs.js.map
