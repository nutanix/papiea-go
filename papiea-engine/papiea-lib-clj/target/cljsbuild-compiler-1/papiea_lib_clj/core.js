// Compiled by ClojureScript 1.10.439 {:target :nodejs}
goog.provide('papiea_lib_clj.core');
goog.require('cljs.core');
goog.require('cljs.nodejs');
goog.require('instaparse.core');
cljs.nodejs.enable_util_print_BANG_.call(null);
papiea_lib_clj.core.sfs_parser = instaparse.core.parser.call(null,"S                = simple-complex     \n\n    (* optimize simple case *)\n    <simple-complex> = complex | simple \n    <non-simple>     = vector  | group    \n\n    (* this trick avoids ambiguity *)\n    complex          = (simple <'.'>)? c (<'.'> simple)? \n\n    (* Allows for arbitraty simple/non-simple combination without introducing ambiguity *)\n    <c>              = non-simple (<'.'> non-simple)* | (non-simple <'.'>)+ simple (<'.'> c) \n\n    (* regular flow *)\n    group            = <'['> simple-complex (<','> (<' '>)* simple-complex)*  <']'>\n    simple           = path \n    <path>           = field (<'.'> field)*\n    vector           = (add | del | change) <'{'> path <'}'>\n    add              = <'+'>\n    del              = <'-'>\n    change           = epsilon\n    <field>          = #'[a-zA-Z_0-9]+'");
/**
 * Optimizer for now simply removes a `complex` node when it consists of
 *   only a single operation. This was to obfuscated to describe in the parser
 */
papiea_lib_clj.core.optimize_ast = (function papiea_lib_clj$core$optimize_ast(ast){
return instaparse.core.transform.call(null,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"complex","complex",1415610825),(function() { 
var G__9735__delegate = function (a){
if(cljs.core._EQ_.call(null,(1),cljs.core.count.call(null,a))){
return cljs.core.first.call(null,a);
} else {
return cljs.core.into.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("papiea","complex","papiea/complex",-1849732957)], null),a);
}
};
var G__9735 = function (var_args){
var a = null;
if (arguments.length > 0) {
var G__9736__i = 0, G__9736__a = new Array(arguments.length -  0);
while (G__9736__i < G__9736__a.length) {G__9736__a[G__9736__i] = arguments[G__9736__i + 0]; ++G__9736__i;}
  a = new cljs.core.IndexedSeq(G__9736__a,0,null);
} 
return G__9735__delegate.call(this,a);};
G__9735.cljs$lang$maxFixedArity = 0;
G__9735.cljs$lang$applyTo = (function (arglist__9737){
var a = cljs.core.seq(arglist__9737);
return G__9735__delegate(a);
});
G__9735.cljs$core$IFn$_invoke$arity$variadic = G__9735__delegate;
return G__9735;
})()
,new cljs.core.Keyword(null,"simple","simple",-581868663),(function() { 
var G__9738__delegate = function (a){
return cljs.core.into.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("papiea","simple","papiea/simple",321590627)], null),a);
};
var G__9738 = function (var_args){
var a = null;
if (arguments.length > 0) {
var G__9739__i = 0, G__9739__a = new Array(arguments.length -  0);
while (G__9739__i < G__9739__a.length) {G__9739__a[G__9739__i] = arguments[G__9739__i + 0]; ++G__9739__i;}
  a = new cljs.core.IndexedSeq(G__9739__a,0,null);
} 
return G__9738__delegate.call(this,a);};
G__9738.cljs$lang$maxFixedArity = 0;
G__9738.cljs$lang$applyTo = (function (arglist__9740){
var a = cljs.core.seq(arglist__9740);
return G__9738__delegate(a);
});
G__9738.cljs$core$IFn$_invoke$arity$variadic = G__9738__delegate;
return G__9738;
})()
,new cljs.core.Keyword(null,"vector","vector",1902966158),(function() { 
var G__9741__delegate = function (a){
return cljs.core.into.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("papiea","vector","papiea/vector",-1239743668)], null),a);
};
var G__9741 = function (var_args){
var a = null;
if (arguments.length > 0) {
var G__9742__i = 0, G__9742__a = new Array(arguments.length -  0);
while (G__9742__i < G__9742__a.length) {G__9742__a[G__9742__i] = arguments[G__9742__i + 0]; ++G__9742__i;}
  a = new cljs.core.IndexedSeq(G__9742__a,0,null);
} 
return G__9741__delegate.call(this,a);};
G__9741.cljs$lang$maxFixedArity = 0;
G__9741.cljs$lang$applyTo = (function (arglist__9743){
var a = cljs.core.seq(arglist__9743);
return G__9741__delegate(a);
});
G__9741.cljs$core$IFn$_invoke$arity$variadic = G__9741__delegate;
return G__9741;
})()
,new cljs.core.Keyword(null,"group","group",582596132),(function() { 
var G__9744__delegate = function (a){
if(cljs.core._EQ_.call(null,(1),cljs.core.count.call(null,a))){
return cljs.core.first.call(null,a);
} else {
return cljs.core.into.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("papiea","group","papiea/group",1614236774)], null),a);
}
};
var G__9744 = function (var_args){
var a = null;
if (arguments.length > 0) {
var G__9745__i = 0, G__9745__a = new Array(arguments.length -  0);
while (G__9745__i < G__9745__a.length) {G__9745__a[G__9745__i] = arguments[G__9745__i + 0]; ++G__9745__i;}
  a = new cljs.core.IndexedSeq(G__9745__a,0,null);
} 
return G__9744__delegate.call(this,a);};
G__9744.cljs$lang$maxFixedArity = 0;
G__9744.cljs$lang$applyTo = (function (arglist__9746){
var a = cljs.core.seq(arglist__9746);
return G__9744__delegate(a);
});
G__9744.cljs$core$IFn$_invoke$arity$variadic = G__9744__delegate;
return G__9744;
})()
], null),ast);
});
/**
 * Prepare a spec/status pair to be diffed by the compiled Differ
 */
papiea_lib_clj.core.prepare = (function papiea_lib_clj$core$prepare(spec,status){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"keys","keys",1068423698),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword("papiea","item","papiea/item",-894439864),new cljs.core.Keyword(null,"spec-val","spec-val",-427580743),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [spec], null),new cljs.core.Keyword(null,"status-val","status-val",1459723935),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [status], null)], null)], null);
});
/**
 * Used to flatten embedded multiple choices
 */
papiea_lib_clj.core.flat_choices = (function papiea_lib_clj$core$flat_choices(x){
if(((cljs.core.vector_QMARK_.call(null,x)) && (cljs.core._EQ_.call(null,(1),cljs.core.count.call(null,x))) && (cljs.core.vector_QMARK_.call(null,cljs.core.first.call(null,x))))){
return cljs.core.first.call(null,x);
} else {
return x;
}
});
/**
 * ensure the item is a vector. If not, turns to vector. Nil is empty vector
 */
papiea_lib_clj.core.ensure_vec = (function papiea_lib_clj$core$ensure_vec(x){
if((x == null)){
return cljs.core.PersistentVector.EMPTY;
} else {
if(cljs.core.vector_QMARK_.call(null,x)){
return x;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [x], null);

}
}
});
papiea_lib_clj.core.ensure_vector_action = (function papiea_lib_clj$core$ensure_vector_action(action,p__9747){
var map__9748 = p__9747;
var map__9748__$1 = (((((!((map__9748 == null))))?(((((map__9748.cljs$lang$protocol_mask$partition0$ & (64))) || ((cljs.core.PROTOCOL_SENTINEL === map__9748.cljs$core$ISeq$))))?true:false):false))?cljs.core.apply.call(null,cljs.core.hash_map,map__9748):map__9748);
var spec_val = cljs.core.get.call(null,map__9748__$1,new cljs.core.Keyword(null,"spec-val","spec-val",-427580743));
var status_val = cljs.core.get.call(null,map__9748__$1,new cljs.core.Keyword(null,"status-val","status-val",1459723935));
var pred__9750 = cljs.core._EQ_;
var expr__9751 = action;
if(cljs.core.truth_(pred__9750.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"add","add",235287739)], null),expr__9751))){
return ((cljs.core.empty_QMARK_.call(null,status_val)) && (cljs.core.seq.call(null,spec_val)));
} else {
if(cljs.core.truth_(pred__9750.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"del","del",574975584)], null),expr__9751))){
return ((cljs.core.empty_QMARK_.call(null,spec_val)) && (cljs.core.seq.call(null,status_val)));
} else {
if(cljs.core.truth_(pred__9750.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"change","change",-1163046502)], null),expr__9751))){
return ((cljs.core.seq.call(null,spec_val)) && (cljs.core.seq.call(null,status_val)) && (cljs.core.not_EQ_.call(null,spec_val,status_val)));
} else {
if(cljs.core.truth_(pred__9750.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"all","all",892129742)], null),expr__9751))){
return true;
} else {
throw (new Error("Error, dont know what to ensure on vector"));
}
}
}
}
});
/**
 * Similar to `core.get-in` but allows for maps with keys that are
 *   either strings or keywords to be queried using the same `ks` path
 */
papiea_lib_clj.core.get_in_SINGLEQUOTE_ = (function papiea_lib_clj$core$get_in_SINGLEQUOTE_(m,ks){
var or__4047__auto__ = cljs.core.get_in.call(null,m,cljs.core.mapv.call(null,cljs.core.name,ks));
if(cljs.core.truth_(or__4047__auto__)){
return or__4047__auto__;
} else {
return cljs.core.get_in.call(null,m,cljs.core.mapv.call(null,cljs.core.keyword,ks));
}
});
papiea_lib_clj.core.filter_diff = (function papiea_lib_clj$core$filter_diff(results){
return cljs.core.filterv.call(null,(function (p1__9753_SHARP_){
return cljs.core.not_EQ_.call(null,new cljs.core.Keyword(null,"spec-val","spec-val",-427580743).cljs$core$IFn$_invoke$arity$1(p1__9753_SHARP_),new cljs.core.Keyword(null,"status-val","status-val",1459723935).cljs$core$IFn$_invoke$arity$1(p1__9753_SHARP_));
}),results);
});
/**
 * If the sequence is empty, return nil
 */
papiea_lib_clj.core.empty_nil = (function papiea_lib_clj$core$empty_nil(xs){
if(cljs.core.empty_QMARK_.call(null,xs)){
return null;
} else {
return xs;
}
});
/**
 * Ensure that a sequence has at least one item. This is used to short
 *   when looking for matches in vectors
 */
papiea_lib_clj.core.ensure_some = (function papiea_lib_clj$core$ensure_some(xs){
if((cljs.core.count.call(null,xs) === (0))){
throw (new Error("none found"));
} else {
return xs;
}
});
if((typeof papiea_lib_clj !== 'undefined') && (typeof papiea_lib_clj.core !== 'undefined') && (typeof papiea_lib_clj.core.sfs_compiler !== 'undefined')){
} else {
/**
 * Compile sfs-signature ast, as generated by the parser and optimizer
 *   by the optimizer. For now the optimizer must be used because of our
 *   use of namespaced keywords in the AST. Unfortunately there is no way
 *   to tell instaparse to emit namepsaced keywords yet.
 */
papiea_lib_clj.core.sfs_compiler = (function (){var method_table__4524__auto__ = cljs.core.atom.call(null,cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__4525__auto__ = cljs.core.atom.call(null,cljs.core.PersistentArrayMap.EMPTY);
var method_cache__4526__auto__ = cljs.core.atom.call(null,cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__4527__auto__ = cljs.core.atom.call(null,cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__4528__auto__ = cljs.core.get.call(null,cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),cljs.core.get_global_hierarchy.call(null));
return (new cljs.core.MultiFn(cljs.core.symbol.call(null,"papiea-lib-clj.core","sfs-compiler"),((function (method_table__4524__auto__,prefer_table__4525__auto__,method_cache__4526__auto__,cached_hierarchy__4527__auto__,hierarchy__4528__auto__){
return (function (x){
return cljs.core.first.call(null,x);
});})(method_table__4524__auto__,prefer_table__4525__auto__,method_cache__4526__auto__,cached_hierarchy__4527__auto__,hierarchy__4528__auto__))
,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__4528__auto__,method_table__4524__auto__,prefer_table__4525__auto__,method_cache__4526__auto__,cached_hierarchy__4527__auto__));
})();
}
cljs.core._add_method.call(null,papiea_lib_clj.core.sfs_compiler,new cljs.core.Keyword(null,"S","S",1267293308),(function (p__9754){
var vec__9755 = p__9754;
var _ = cljs.core.nth.call(null,vec__9755,(0),null);
var q = cljs.core.nth.call(null,vec__9755,(1),null);
var c = papiea_lib_clj.core.sfs_compiler.call(null,q);
return ((function (c,vec__9755,_,q){
return (function (results){
try{return papiea_lib_clj.core.empty_nil.call(null,papiea_lib_clj.core.filter_diff.call(null,c.call(null,results)));
}catch (e9758){if((e9758 instanceof Error)){
var e = e9758;
return null;
} else {
throw e9758;

}
}});
;})(c,vec__9755,_,q))
}));
cljs.core._add_method.call(null,papiea_lib_clj.core.sfs_compiler,new cljs.core.Keyword("papiea","simple","papiea/simple",321590627),(function (p__9761){
var vec__9762 = p__9761;
var seq__9763 = cljs.core.seq.call(null,vec__9762);
var first__9764 = cljs.core.first.call(null,seq__9763);
var seq__9763__$1 = cljs.core.next.call(null,seq__9763);
var _ = first__9764;
var ks = seq__9763__$1;
return ((function (vec__9762,seq__9763,first__9764,seq__9763__$1,_,ks){
return (function (results){
return cljs.core.mapv.call(null,((function (vec__9762,seq__9763,first__9764,seq__9763__$1,_,ks){
return (function (p__9765){
var map__9766 = p__9765;
var map__9766__$1 = (((((!((map__9766 == null))))?(((((map__9766.cljs$lang$protocol_mask$partition0$ & (64))) || ((cljs.core.PROTOCOL_SENTINEL === map__9766.cljs$core$ISeq$))))?true:false):false))?cljs.core.apply.call(null,cljs.core.hash_map,map__9766):map__9766);
var keys = cljs.core.get.call(null,map__9766__$1,new cljs.core.Keyword(null,"keys","keys",1068423698));
var key = cljs.core.get.call(null,map__9766__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var spec_val = cljs.core.get.call(null,map__9766__$1,new cljs.core.Keyword(null,"spec-val","spec-val",-427580743));
var status_val = cljs.core.get.call(null,map__9766__$1,new cljs.core.Keyword(null,"status-val","status-val",1459723935));
var s1 = cljs.core.mapv.call(null,((function (map__9766,map__9766__$1,keys,key,spec_val,status_val,vec__9762,seq__9763,first__9764,seq__9763__$1,_,ks){
return (function (p1__9759_SHARP_){
return papiea_lib_clj.core.get_in_SINGLEQUOTE_.call(null,p1__9759_SHARP_,ks);
});})(map__9766,map__9766__$1,keys,key,spec_val,status_val,vec__9762,seq__9763,first__9764,seq__9763__$1,_,ks))
,spec_val);
var s2 = cljs.core.mapv.call(null,((function (s1,map__9766,map__9766__$1,keys,key,spec_val,status_val,vec__9762,seq__9763,first__9764,seq__9763__$1,_,ks){
return (function (p1__9760_SHARP_){
return papiea_lib_clj.core.get_in_SINGLEQUOTE_.call(null,p1__9760_SHARP_,ks);
});})(s1,map__9766,map__9766__$1,keys,key,spec_val,status_val,vec__9762,seq__9763,first__9764,seq__9763__$1,_,ks))
,status_val);
var empty = ((cljs.core.empty_QMARK_.call(null,s1)) || (cljs.core.empty_QMARK_.call(null,s2)));
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"keys","keys",1068423698),keys,new cljs.core.Keyword(null,"key","key",-1516042587),((empty)?key:cljs.core.last.call(null,ks)),new cljs.core.Keyword(null,"spec-val","spec-val",-427580743),((empty)?spec_val:papiea_lib_clj.core.flat_choices.call(null,s1)),new cljs.core.Keyword(null,"status-val","status-val",1459723935),((empty)?status_val:papiea_lib_clj.core.flat_choices.call(null,s2))], null);
});})(vec__9762,seq__9763,first__9764,seq__9763__$1,_,ks))
,results);
});
;})(vec__9762,seq__9763,first__9764,seq__9763__$1,_,ks))
}));
cljs.core._add_method.call(null,papiea_lib_clj.core.sfs_compiler,new cljs.core.Keyword("papiea","vector","papiea/vector",-1239743668),(function (p__9771){
var vec__9772 = p__9771;
var seq__9773 = cljs.core.seq.call(null,vec__9772);
var first__9774 = cljs.core.first.call(null,seq__9773);
var seq__9773__$1 = cljs.core.next.call(null,seq__9773);
var _ = first__9774;
var first__9774__$1 = cljs.core.first.call(null,seq__9773__$1);
var seq__9773__$2 = cljs.core.next.call(null,seq__9773__$1);
var action = first__9774__$1;
var ks = seq__9773__$2;
return ((function (vec__9772,seq__9773,first__9774,seq__9773__$1,_,first__9774__$1,seq__9773__$2,action,ks){
return (function (results){
return cljs.core.into.call(null,cljs.core.PersistentVector.EMPTY,cljs.core.mapcat.call(null,((function (vec__9772,seq__9773,first__9774,seq__9773__$1,_,first__9774__$1,seq__9773__$2,action,ks){
return (function (p__9775){
var map__9776 = p__9775;
var map__9776__$1 = (((((!((map__9776 == null))))?(((((map__9776.cljs$lang$protocol_mask$partition0$ & (64))) || ((cljs.core.PROTOCOL_SENTINEL === map__9776.cljs$core$ISeq$))))?true:false):false))?cljs.core.apply.call(null,cljs.core.hash_map,map__9776):map__9776);
var keys = cljs.core.get.call(null,map__9776__$1,new cljs.core.Keyword(null,"keys","keys",1068423698));
var key = cljs.core.get.call(null,map__9776__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var spec_val = cljs.core.get.call(null,map__9776__$1,new cljs.core.Keyword(null,"spec-val","spec-val",-427580743));
var status_val = cljs.core.get.call(null,map__9776__$1,new cljs.core.Keyword(null,"status-val","status-val",1459723935));
return papiea_lib_clj.core.ensure_some.call(null,cljs.core.filterv.call(null,cljs.core.partial.call(null,papiea_lib_clj.core.ensure_vector_action,action),cljs.core.mapv.call(null,((function (map__9776,map__9776__$1,keys,key,spec_val,status_val,vec__9772,seq__9773,first__9774,seq__9773__$1,_,first__9774__$1,seq__9773__$2,action,ks){
return (function (p__9778){
var vec__9779 = p__9778;
var id_val = cljs.core.nth.call(null,vec__9779,(0),null);
var vec__9782 = cljs.core.nth.call(null,vec__9779,(1),null);
var s1 = cljs.core.nth.call(null,vec__9782,(0),null);
var s2 = cljs.core.nth.call(null,vec__9782,(1),null);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"keys","keys",1068423698),cljs.core.assoc.call(null,keys,cljs.core.last.call(null,ks),id_val),new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"spec-val","spec-val",-427580743),papiea_lib_clj.core.ensure_vec.call(null,(cljs.core.truth_(new cljs.core.Keyword("papiea","spec","papiea/spec",-681531957).cljs$core$IFn$_invoke$arity$1(s1))?cljs.core.dissoc.call(null,s1,new cljs.core.Keyword("papiea","spec","papiea/spec",-681531957)):(cljs.core.truth_(new cljs.core.Keyword("papiea","spec","papiea/spec",-681531957).cljs$core$IFn$_invoke$arity$1(s2))?cljs.core.dissoc.call(null,s2,new cljs.core.Keyword("papiea","spec","papiea/spec",-681531957)):null
))),new cljs.core.Keyword(null,"status-val","status-val",1459723935),papiea_lib_clj.core.ensure_vec.call(null,(cljs.core.truth_(new cljs.core.Keyword("papiea","status","papiea/status",1076245033).cljs$core$IFn$_invoke$arity$1(s1))?cljs.core.dissoc.call(null,s1,new cljs.core.Keyword("papiea","status","papiea/status",1076245033)):(cljs.core.truth_(new cljs.core.Keyword("papiea","status","papiea/status",1076245033).cljs$core$IFn$_invoke$arity$1(s2))?cljs.core.dissoc.call(null,s2,new cljs.core.Keyword("papiea","status","papiea/status",1076245033)):null
)))], null);
});})(map__9776,map__9776__$1,keys,key,spec_val,status_val,vec__9772,seq__9773,first__9774,seq__9773__$1,_,first__9774__$1,seq__9773__$2,action,ks))
,cljs.core.group_by.call(null,((function (map__9776,map__9776__$1,keys,key,spec_val,status_val,vec__9772,seq__9773,first__9774,seq__9773__$1,_,first__9774__$1,seq__9773__$2,action,ks){
return (function (p1__9768_SHARP_){
return papiea_lib_clj.core.get_in_SINGLEQUOTE_.call(null,p1__9768_SHARP_,ks);
});})(map__9776,map__9776__$1,keys,key,spec_val,status_val,vec__9772,seq__9773,first__9774,seq__9773__$1,_,first__9774__$1,seq__9773__$2,action,ks))
,cljs.core.into.call(null,cljs.core.mapv.call(null,((function (map__9776,map__9776__$1,keys,key,spec_val,status_val,vec__9772,seq__9773,first__9774,seq__9773__$1,_,first__9774__$1,seq__9773__$2,action,ks){
return (function (p1__9769_SHARP_){
return cljs.core.assoc.call(null,p1__9769_SHARP_,new cljs.core.Keyword("papiea","spec","papiea/spec",-681531957),true);
});})(map__9776,map__9776__$1,keys,key,spec_val,status_val,vec__9772,seq__9773,first__9774,seq__9773__$1,_,first__9774__$1,seq__9773__$2,action,ks))
,spec_val),cljs.core.mapv.call(null,((function (map__9776,map__9776__$1,keys,key,spec_val,status_val,vec__9772,seq__9773,first__9774,seq__9773__$1,_,first__9774__$1,seq__9773__$2,action,ks){
return (function (p1__9770_SHARP_){
return cljs.core.assoc.call(null,p1__9770_SHARP_,new cljs.core.Keyword("papiea","status","papiea/status",1076245033),true);
});})(map__9776,map__9776__$1,keys,key,spec_val,status_val,vec__9772,seq__9773,first__9774,seq__9773__$1,_,first__9774__$1,seq__9773__$2,action,ks))
,status_val))))));
});})(vec__9772,seq__9773,first__9774,seq__9773__$1,_,first__9774__$1,seq__9773__$2,action,ks))
,results));
});
;})(vec__9772,seq__9773,first__9774,seq__9773__$1,_,first__9774__$1,seq__9773__$2,action,ks))
}));
cljs.core._add_method.call(null,papiea_lib_clj.core.sfs_compiler,new cljs.core.Keyword("papiea","complex","papiea/complex",-1849732957),(function (p__9785){
var vec__9786 = p__9785;
var seq__9787 = cljs.core.seq.call(null,vec__9786);
var first__9788 = cljs.core.first.call(null,seq__9787);
var seq__9787__$1 = cljs.core.next.call(null,seq__9787);
var _ = first__9788;
var cmds = seq__9787__$1;
var cs = cljs.core.mapv.call(null,papiea_lib_clj.core.sfs_compiler,cmds);
return ((function (cs,vec__9786,seq__9787,first__9788,seq__9787__$1,_,cmds){
return (function (results){
return cljs.core.reduce.call(null,((function (cs,vec__9786,seq__9787,first__9788,seq__9787__$1,_,cmds){
return (function (o,f){
return f.call(null,o);
});})(cs,vec__9786,seq__9787,first__9788,seq__9787__$1,_,cmds))
,results,cs);
});
;})(cs,vec__9786,seq__9787,first__9788,seq__9787__$1,_,cmds))
}));
papiea_lib_clj.core.subset = (function papiea_lib_clj$core$subset(a,b){
return cljs.core._EQ_.call(null,cljs.core.select_keys.call(null,b,cljs.core.keys.call(null,a)),a);
});
cljs.core._add_method.call(null,papiea_lib_clj.core.sfs_compiler,new cljs.core.Keyword("papiea","group","papiea/group",1614236774),(function (p__9790){
var vec__9791 = p__9790;
var seq__9792 = cljs.core.seq.call(null,vec__9791);
var first__9793 = cljs.core.first.call(null,seq__9792);
var seq__9792__$1 = cljs.core.next.call(null,seq__9792);
var _ = first__9793;
var cmds = seq__9792__$1;
var cs = cljs.core.mapv.call(null,papiea_lib_clj.core.sfs_compiler,cmds);
return ((function (cs,vec__9791,seq__9792,first__9793,seq__9792__$1,_,cmds){
return (function (results){
var prior_ids = cljs.core.into.call(null,cljs.core.PersistentHashSet.EMPTY,cljs.core.map.call(null,new cljs.core.Keyword(null,"keys","keys",1068423698),results));
var rs = cljs.core.mapcat.call(null,((function (prior_ids,cs,vec__9791,seq__9792,first__9793,seq__9792__$1,_,cmds){
return (function (f){
return papiea_lib_clj.core.filter_diff.call(null,f.call(null,results));
});})(prior_ids,cs,vec__9791,seq__9792,first__9793,seq__9792__$1,_,cmds))
,cs);
return cljs.core.vec.call(null,cljs.core.apply.call(null,cljs.core.concat,cljs.core.filter.call(null,((function (prior_ids,rs,cs,vec__9791,seq__9792,first__9793,seq__9792__$1,_,cmds){
return (function (p1__9789_SHARP_){
return cljs.core._EQ_.call(null,cljs.core.count.call(null,cs),cljs.core.count.call(null,cljs.core.group_by.call(null,new cljs.core.Keyword(null,"key","key",-1516042587),p1__9789_SHARP_)));
});})(prior_ids,rs,cs,vec__9791,seq__9792,first__9793,seq__9792__$1,_,cmds))
,cljs.core.map.call(null,((function (prior_ids,rs,cs,vec__9791,seq__9792,first__9793,seq__9792__$1,_,cmds){
return (function (id){
return cljs.core.filter.call(null,((function (prior_ids,rs,cs,vec__9791,seq__9792,first__9793,seq__9792__$1,_,cmds){
return (function (y){
return papiea_lib_clj.core.subset.call(null,id,new cljs.core.Keyword(null,"keys","keys",1068423698).cljs$core$IFn$_invoke$arity$1(y));
});})(prior_ids,rs,cs,vec__9791,seq__9792,first__9793,seq__9792__$1,_,cmds))
,rs);
});})(prior_ids,rs,cs,vec__9791,seq__9792,first__9793,seq__9792__$1,_,cmds))
,prior_ids))));
});
;})(cs,vec__9791,seq__9792,first__9793,seq__9792__$1,_,cmds))
}));
papiea_lib_clj.core.clj_str = (function papiea_lib_clj$core$clj_str(a){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(a);
});
goog.exportSymbol('papiea_lib_clj.core.clj_str', papiea_lib_clj.core.clj_str);
papiea_lib_clj.core.parse_sfs = (function papiea_lib_clj$core$parse_sfs(sfs_signature){
return instaparse.core.parse.call(null,papiea_lib_clj.core.sfs_parser,sfs_signature);
});
goog.exportSymbol('papiea_lib_clj.core.parse_sfs', papiea_lib_clj.core.parse_sfs);
papiea_lib_clj.core.optimize_sfs_ast = (function papiea_lib_clj$core$optimize_sfs_ast(ast){
return papiea_lib_clj.core.optimize_ast.call(null,ast);
});
goog.exportSymbol('papiea_lib_clj.core.optimize_sfs_ast', papiea_lib_clj.core.optimize_sfs_ast);
papiea_lib_clj.core.compile_sfs_ast = (function papiea_lib_clj$core$compile_sfs_ast(ast){
return papiea_lib_clj.core.sfs_compiler.call(null,ast);
});
goog.exportSymbol('papiea_lib_clj.core.compile_sfs_ast', papiea_lib_clj.core.compile_sfs_ast);
papiea_lib_clj.core.compile_sfs = (function papiea_lib_clj$core$compile_sfs(sfs_signature){
var sfs_fn = (function (){var G__9794 = sfs_signature;
var G__9794__$1 = (((G__9794 == null))?null:papiea_lib_clj.core.parse_sfs.call(null,G__9794));
var G__9794__$2 = (((G__9794__$1 == null))?null:papiea_lib_clj.core.optimize_ast.call(null,G__9794__$1));
if((G__9794__$2 == null)){
return null;
} else {
return papiea_lib_clj.core.sfs_compiler.call(null,G__9794__$2);
}
})();
if(cljs.core.fn_QMARK_.call(null,sfs_fn)){
return sfs_fn;
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error-compiling-sfs","error-compiling-sfs",-1588292227),new cljs.core.Keyword(null,"sfs-fn","sfs-fn",316755287),new cljs.core.Keyword(null,"sfs-signature","sfs-signature",1233671119),sfs_signature], null);
}
});
goog.exportSymbol('papiea_lib_clj.core.compile_sfs', papiea_lib_clj.core.compile_sfs);
papiea_lib_clj.core.run_compiled_sfs = (function papiea_lib_clj$core$run_compiled_sfs(compiled_sfs_fn,spec,status){
var spec__$1 = cljs.core.js__GT_clj.call(null,spec);
var status__$1 = cljs.core.js__GT_clj.call(null,status);
var results = papiea_lib_clj.core.prepare.call(null,spec__$1,status__$1);
return cljs.core.clj__GT_js.call(null,compiled_sfs_fn.call(null,results));
});
goog.exportSymbol('papiea_lib_clj.core.run_compiled_sfs', papiea_lib_clj.core.run_compiled_sfs);
papiea_lib_clj.core._main = (function papiea_lib_clj$core$_main(var_args){
var args__4647__auto__ = [];
var len__4641__auto___9796 = arguments.length;
var i__4642__auto___9797 = (0);
while(true){
if((i__4642__auto___9797 < len__4641__auto___9796)){
args__4647__auto__.push((arguments[i__4642__auto___9797]));

var G__9798 = (i__4642__auto___9797 + (1));
i__4642__auto___9797 = G__9798;
continue;
} else {
}
break;
}

var argseq__4648__auto__ = ((((0) < args__4647__auto__.length))?(new cljs.core.IndexedSeq(args__4647__auto__.slice((0)),(0),null)):null);
return papiea_lib_clj.core._main.cljs$core$IFn$_invoke$arity$variadic(argseq__4648__auto__);
});

papiea_lib_clj.core._main.cljs$core$IFn$_invoke$arity$variadic = (function (args){
return cljs.core.println.call(null,"Hello world");
});

papiea_lib_clj.core._main.cljs$lang$maxFixedArity = (0);

/** @this {Function} */
papiea_lib_clj.core._main.cljs$lang$applyTo = (function (seq9795){
var self__4629__auto__ = this;
return self__4629__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq.call(null,seq9795));
});

cljs.core._STAR_main_cli_fn_STAR_ = papiea_lib_clj.core._main;

//# sourceMappingURL=core.js.map
