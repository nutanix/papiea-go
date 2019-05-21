goog.provide('cljs.nodejs');
goog.require('cljs.core');
cljs.nodejs.require = require;
cljs.nodejs.process = process;
cljs.nodejs.enable_util_print_BANG_ = (function cljs$nodejs$enable_util_print_BANG_(){
cljs.core._STAR_print_newline_STAR_ = false;

cljs.core.set_print_fn_BANG_.call(null,(function() { 
var G__6848__delegate = function (args){
return console.log.apply(console,cljs.core.into_array.call(null,args));
};
var G__6848 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__6849__i = 0, G__6849__a = new Array(arguments.length -  0);
while (G__6849__i < G__6849__a.length) {G__6849__a[G__6849__i] = arguments[G__6849__i + 0]; ++G__6849__i;}
  args = new cljs.core.IndexedSeq(G__6849__a,0,null);
} 
return G__6848__delegate.call(this,args);};
G__6848.cljs$lang$maxFixedArity = 0;
G__6848.cljs$lang$applyTo = (function (arglist__6850){
var args = cljs.core.seq(arglist__6850);
return G__6848__delegate(args);
});
G__6848.cljs$core$IFn$_invoke$arity$variadic = G__6848__delegate;
return G__6848;
})()
);

cljs.core.set_print_err_fn_BANG_.call(null,(function() { 
var G__6851__delegate = function (args){
return console.error.apply(console,cljs.core.into_array.call(null,args));
};
var G__6851 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__6852__i = 0, G__6852__a = new Array(arguments.length -  0);
while (G__6852__i < G__6852__a.length) {G__6852__a[G__6852__i] = arguments[G__6852__i + 0]; ++G__6852__i;}
  args = new cljs.core.IndexedSeq(G__6852__a,0,null);
} 
return G__6851__delegate.call(this,args);};
G__6851.cljs$lang$maxFixedArity = 0;
G__6851.cljs$lang$applyTo = (function (arglist__6853){
var args = cljs.core.seq(arglist__6853);
return G__6851__delegate(args);
});
G__6851.cljs$core$IFn$_invoke$arity$variadic = G__6851__delegate;
return G__6851;
})()
);

return null;
});
