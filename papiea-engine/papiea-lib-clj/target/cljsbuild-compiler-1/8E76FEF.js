goog.provide('cljs.nodejs');
goog.require('cljs.core');
cljs.nodejs.require = require;
cljs.nodejs.process = process;
cljs.nodejs.enable_util_print_BANG_ = (function cljs$nodejs$enable_util_print_BANG_(){
cljs.core._STAR_print_newline_STAR_ = false;

cljs.core.set_print_fn_BANG_.call(null,(function() { 
var G__9936__delegate = function (args){
return console.log.apply(console,cljs.core.into_array.call(null,args));
};
var G__9936 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__9937__i = 0, G__9937__a = new Array(arguments.length -  0);
while (G__9937__i < G__9937__a.length) {G__9937__a[G__9937__i] = arguments[G__9937__i + 0]; ++G__9937__i;}
  args = new cljs.core.IndexedSeq(G__9937__a,0,null);
} 
return G__9936__delegate.call(this,args);};
G__9936.cljs$lang$maxFixedArity = 0;
G__9936.cljs$lang$applyTo = (function (arglist__9938){
var args = cljs.core.seq(arglist__9938);
return G__9936__delegate(args);
});
G__9936.cljs$core$IFn$_invoke$arity$variadic = G__9936__delegate;
return G__9936;
})()
);

cljs.core.set_print_err_fn_BANG_.call(null,(function() { 
var G__9939__delegate = function (args){
return console.error.apply(console,cljs.core.into_array.call(null,args));
};
var G__9939 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__9940__i = 0, G__9940__a = new Array(arguments.length -  0);
while (G__9940__i < G__9940__a.length) {G__9940__a[G__9940__i] = arguments[G__9940__i + 0]; ++G__9940__i;}
  args = new cljs.core.IndexedSeq(G__9940__a,0,null);
} 
return G__9939__delegate.call(this,args);};
G__9939.cljs$lang$maxFixedArity = 0;
G__9939.cljs$lang$applyTo = (function (arglist__9941){
var args = cljs.core.seq(arglist__9941);
return G__9939__delegate(args);
});
G__9939.cljs$core$IFn$_invoke$arity$variadic = G__9939__delegate;
return G__9939;
})()
);

return null;
});
