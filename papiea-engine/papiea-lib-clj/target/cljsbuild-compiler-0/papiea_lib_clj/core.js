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
var G__6774__delegate = function (a){
if(cljs.core._EQ_.call(null,(1),cljs.core.count.call(null,a))){
return cljs.core.first.call(null,a);
} else {
return cljs.core.into.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("papiea","complex","papiea/complex",-1849732957)], null),a);
}
};
var G__6774 = function (var_args){
var a = null;
if (arguments.length > 0) {
var G__6775__i = 0, G__6775__a = new Array(arguments.length -  0);
while (G__6775__i < G__6775__a.length) {G__6775__a[G__6775__i] = arguments[G__6775__i + 0]; ++G__6775__i;}
  a = new cljs.core.IndexedSeq(G__6775__a,0,null);
} 
return G__6774__delegate.call(this,a);};
G__6774.cljs$lang$maxFixedArity = 0;
G__6774.cljs$lang$applyTo = (function (arglist__6776){
var a = cljs.core.seq(arglist__6776);
return G__6774__delegate(a);
});
G__6774.cljs$core$IFn$_invoke$arity$variadic = G__6774__delegate;
return G__6774;
})()
,new cljs.core.Keyword(null,"simple","simple",-581868663),(function() { 
var G__6777__delegate = function (a){
return cljs.core.into.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("papiea","simple","papiea/simple",321590627)], null),a);
};
var G__6777 = function (var_args){
var a = null;
if (arguments.length > 0) {
var G__6778__i = 0, G__6778__a = new Array(arguments.length -  0);
while (G__6778__i < G__6778__a.length) {G__6778__a[G__6778__i] = arguments[G__6778__i + 0]; ++G__6778__i;}
  a = new cljs.core.IndexedSeq(G__6778__a,0,null);
} 
return G__6777__delegate.call(this,a);};
G__6777.cljs$lang$maxFixedArity = 0;
G__6777.cljs$lang$applyTo = (function (arglist__6779){
var a = cljs.core.seq(arglist__6779);
return G__6777__delegate(a);
});
G__6777.cljs$core$IFn$_invoke$arity$variadic = G__6777__delegate;
return G__6777;
})()
,new cljs.core.Keyword(null,"vector","vector",1902966158),(function() { 
var G__6780__delegate = function (a){
return cljs.core.into.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("papiea","vector","papiea/vector",-1239743668)], null),a);
};
var G__6780 = function (var_args){
var a = null;
if (arguments.length > 0) {
var G__6781__i = 0, G__6781__a = new Array(arguments.length -  0);
while (G__6781__i < G__6781__a.length) {G__6781__a[G__6781__i] = arguments[G__6781__i + 0]; ++G__6781__i;}
  a = new cljs.core.IndexedSeq(G__6781__a,0,null);
} 
return G__6780__delegate.call(this,a);};
G__6780.cljs$lang$maxFixedArity = 0;
G__6780.cljs$lang$applyTo = (function (arglist__6782){
var a = cljs.core.seq(arglist__6782);
return G__6780__delegate(a);
});
G__6780.cljs$core$IFn$_invoke$arity$variadic = G__6780__delegate;
return G__6780;
})()
,new cljs.core.Keyword(null,"group","group",582596132),(function() { 
var G__6783__delegate = function (a){
if(cljs.core._EQ_.call(null,(1),cljs.core.count.call(null,a))){
return cljs.core.first.call(null,a);
} else {
return cljs.core.into.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("papiea","group","papiea/group",1614236774)], null),a);
}
};
var G__6783 = function (var_args){
var a = null;
if (arguments.length > 0) {
var G__6784__i = 0, G__6784__a = new Array(arguments.length -  0);
while (G__6784__i < G__6784__a.length) {G__6784__a[G__6784__i] = arguments[G__6784__i + 0]; ++G__6784__i;}
  a = new cljs.core.IndexedSeq(G__6784__a,0,null);
} 
return G__6783__delegate.call(this,a);};
G__6783.cljs$lang$maxFixedArity = 0;
G__6783.cljs$lang$applyTo = (function (arglist__6785){
var a = cljs.core.seq(arglist__6785);
return G__6783__delegate(a);
});
G__6783.cljs$core$IFn$_invoke$arity$variadic = G__6783__delegate;
return G__6783;
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
papiea_lib_clj.core.ensure_vector_action = (function papiea_lib_clj$core$ensure_vector_action(action,p__6786){
var map__6787 = p__6786;
var map__6787__$1 = (((((!((map__6787 == null))))?(((((map__6787.cljs$lang$protocol_mask$partition0$ & (64))) || ((cljs.core.PROTOCOL_SENTINEL === map__6787.cljs$core$ISeq$))))?true:false):false))?cljs.core.apply.call(null,cljs.core.hash_map,map__6787):map__6787);
var spec_val = cljs.core.get.call(null,map__6787__$1,new cljs.core.Keyword(null,"spec-val","spec-val",-427580743));
var status_val = cljs.core.get.call(null,map__6787__$1,new cljs.core.Keyword(null,"status-val","status-val",1459723935));
var pred__6789 = cljs.core._EQ_;
var expr__6790 = action;
if(cljs.core.truth_(pred__6789.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"add","add",235287739)], null),expr__6790))){
return ((cljs.core.empty_QMARK_.call(null,status_val)) && (cljs.core.seq.call(null,spec_val)));
} else {
if(cljs.core.truth_(pred__6789.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"del","del",574975584)], null),expr__6790))){
return ((cljs.core.empty_QMARK_.call(null,spec_val)) && (cljs.core.seq.call(null,status_val)));
} else {
if(cljs.core.truth_(pred__6789.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"change","change",-1163046502)], null),expr__6790))){
return ((cljs.core.seq.call(null,spec_val)) && (cljs.core.seq.call(null,status_val)) && (cljs.core.not_EQ_.call(null,spec_val,status_val)));
} else {
if(cljs.core.truth_(pred__6789.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"all","all",892129742)], null),expr__6790))){
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
return cljs.core.filterv.call(null,(function (p1__6792_SHARP_){
return cljs.core.not_EQ_.call(null,new cljs.core.Keyword(null,"spec-val","spec-val",-427580743).cljs$core$IFn$_invoke$arity$1(p1__6792_SHARP_),new cljs.core.Keyword(null,"status-val","status-val",1459723935).cljs$core$IFn$_invoke$arity$1(p1__6792_SHARP_));
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
cljs.core._add_method.call(null,papiea_lib_clj.core.sfs_compiler,new cljs.core.Keyword(null,"S","S",1267293308),(function (p__6793){
var vec__6794 = p__6793;
var _ = cljs.core.nth.call(null,vec__6794,(0),null);
var q = cljs.core.nth.call(null,vec__6794,(1),null);
var c = papiea_lib_clj.core.sfs_compiler.call(null,q);
return ((function (c,vec__6794,_,q){
return (function (results){
try{return papiea_lib_clj.core.empty_nil.call(null,papiea_lib_clj.core.filter_diff.call(null,c.call(null,results)));
}catch (e6797){if((e6797 instanceof Error)){
var e = e6797;
return null;
} else {
throw e6797;

}
}});
;})(c,vec__6794,_,q))
}));
cljs.core._add_method.call(null,papiea_lib_clj.core.sfs_compiler,new cljs.core.Keyword("papiea","simple","papiea/simple",321590627),(function (p__6800){
var vec__6801 = p__6800;
var seq__6802 = cljs.core.seq.call(null,vec__6801);
var first__6803 = cljs.core.first.call(null,seq__6802);
var seq__6802__$1 = cljs.core.next.call(null,seq__6802);
var _ = first__6803;
var ks = seq__6802__$1;
return ((function (vec__6801,seq__6802,first__6803,seq__6802__$1,_,ks){
return (function (results){
return cljs.core.mapv.call(null,((function (vec__6801,seq__6802,first__6803,seq__6802__$1,_,ks){
return (function (p__6804){
var map__6805 = p__6804;
var map__6805__$1 = (((((!((map__6805 == null))))?(((((map__6805.cljs$lang$protocol_mask$partition0$ & (64))) || ((cljs.core.PROTOCOL_SENTINEL === map__6805.cljs$core$ISeq$))))?true:false):false))?cljs.core.apply.call(null,cljs.core.hash_map,map__6805):map__6805);
var keys = cljs.core.get.call(null,map__6805__$1,new cljs.core.Keyword(null,"keys","keys",1068423698));
var key = cljs.core.get.call(null,map__6805__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var spec_val = cljs.core.get.call(null,map__6805__$1,new cljs.core.Keyword(null,"spec-val","spec-val",-427580743));
var status_val = cljs.core.get.call(null,map__6805__$1,new cljs.core.Keyword(null,"status-val","status-val",1459723935));
var s1 = cljs.core.mapv.call(null,((function (map__6805,map__6805__$1,keys,key,spec_val,status_val,vec__6801,seq__6802,first__6803,seq__6802__$1,_,ks){
return (function (p1__6798_SHARP_){
return papiea_lib_clj.core.get_in_SINGLEQUOTE_.call(null,p1__6798_SHARP_,ks);
});})(map__6805,map__6805__$1,keys,key,spec_val,status_val,vec__6801,seq__6802,first__6803,seq__6802__$1,_,ks))
,spec_val);
var s2 = cljs.core.mapv.call(null,((function (s1,map__6805,map__6805__$1,keys,key,spec_val,status_val,vec__6801,seq__6802,first__6803,seq__6802__$1,_,ks){
return (function (p1__6799_SHARP_){
return papiea_lib_clj.core.get_in_SINGLEQUOTE_.call(null,p1__6799_SHARP_,ks);
});})(s1,map__6805,map__6805__$1,keys,key,spec_val,status_val,vec__6801,seq__6802,first__6803,seq__6802__$1,_,ks))
,status_val);
var empty = ((cljs.core.empty_QMARK_.call(null,s1)) || (cljs.core.empty_QMARK_.call(null,s2)));
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"keys","keys",1068423698),keys,new cljs.core.Keyword(null,"key","key",-1516042587),((empty)?key:cljs.core.last.call(null,ks)),new cljs.core.Keyword(null,"spec-val","spec-val",-427580743),((empty)?spec_val:papiea_lib_clj.core.flat_choices.call(null,s1)),new cljs.core.Keyword(null,"status-val","status-val",1459723935),((empty)?status_val:papiea_lib_clj.core.flat_choices.call(null,s2))], null);
});})(vec__6801,seq__6802,first__6803,seq__6802__$1,_,ks))
,results);
});
;})(vec__6801,seq__6802,first__6803,seq__6802__$1,_,ks))
}));
cljs.core._add_method.call(null,papiea_lib_clj.core.sfs_compiler,new cljs.core.Keyword("papiea","vector","papiea/vector",-1239743668),(function (p__6810){
var vec__6811 = p__6810;
var seq__6812 = cljs.core.seq.call(null,vec__6811);
var first__6813 = cljs.core.first.call(null,seq__6812);
var seq__6812__$1 = cljs.core.next.call(null,seq__6812);
var _ = first__6813;
var first__6813__$1 = cljs.core.first.call(null,seq__6812__$1);
var seq__6812__$2 = cljs.core.next.call(null,seq__6812__$1);
var action = first__6813__$1;
var ks = seq__6812__$2;
return ((function (vec__6811,seq__6812,first__6813,seq__6812__$1,_,first__6813__$1,seq__6812__$2,action,ks){
return (function (results){
return cljs.core.into.call(null,cljs.core.PersistentVector.EMPTY,cljs.core.mapcat.call(null,((function (vec__6811,seq__6812,first__6813,seq__6812__$1,_,first__6813__$1,seq__6812__$2,action,ks){
return (function (p__6814){
var map__6815 = p__6814;
var map__6815__$1 = (((((!((map__6815 == null))))?(((((map__6815.cljs$lang$protocol_mask$partition0$ & (64))) || ((cljs.core.PROTOCOL_SENTINEL === map__6815.cljs$core$ISeq$))))?true:false):false))?cljs.core.apply.call(null,cljs.core.hash_map,map__6815):map__6815);
var keys = cljs.core.get.call(null,map__6815__$1,new cljs.core.Keyword(null,"keys","keys",1068423698));
var key = cljs.core.get.call(null,map__6815__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var spec_val = cljs.core.get.call(null,map__6815__$1,new cljs.core.Keyword(null,"spec-val","spec-val",-427580743));
var status_val = cljs.core.get.call(null,map__6815__$1,new cljs.core.Keyword(null,"status-val","status-val",1459723935));
return papiea_lib_clj.core.ensure_some.call(null,cljs.core.filterv.call(null,cljs.core.partial.call(null,papiea_lib_clj.core.ensure_vector_action,action),cljs.core.mapv.call(null,((function (map__6815,map__6815__$1,keys,key,spec_val,status_val,vec__6811,seq__6812,first__6813,seq__6812__$1,_,first__6813__$1,seq__6812__$2,action,ks){
return (function (p__6817){
var vec__6818 = p__6817;
var id_val = cljs.core.nth.call(null,vec__6818,(0),null);
var vec__6821 = cljs.core.nth.call(null,vec__6818,(1),null);
var s1 = cljs.core.nth.call(null,vec__6821,(0),null);
var s2 = cljs.core.nth.call(null,vec__6821,(1),null);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"keys","keys",1068423698),cljs.core.assoc.call(null,keys,cljs.core.last.call(null,ks),id_val),new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"spec-val","spec-val",-427580743),papiea_lib_clj.core.ensure_vec.call(null,(cljs.core.truth_(new cljs.core.Keyword("papiea","spec","papiea/spec",-681531957).cljs$core$IFn$_invoke$arity$1(s1))?cljs.core.dissoc.call(null,s1,new cljs.core.Keyword("papiea","spec","papiea/spec",-681531957)):(cljs.core.truth_(new cljs.core.Keyword("papiea","spec","papiea/spec",-681531957).cljs$core$IFn$_invoke$arity$1(s2))?cljs.core.dissoc.call(null,s2,new cljs.core.Keyword("papiea","spec","papiea/spec",-681531957)):null
))),new cljs.core.Keyword(null,"status-val","status-val",1459723935),papiea_lib_clj.core.ensure_vec.call(null,(cljs.core.truth_(new cljs.core.Keyword("papiea","status","papiea/status",1076245033).cljs$core$IFn$_invoke$arity$1(s1))?cljs.core.dissoc.call(null,s1,new cljs.core.Keyword("papiea","status","papiea/status",1076245033)):(cljs.core.truth_(new cljs.core.Keyword("papiea","status","papiea/status",1076245033).cljs$core$IFn$_invoke$arity$1(s2))?cljs.core.dissoc.call(null,s2,new cljs.core.Keyword("papiea","status","papiea/status",1076245033)):null
)))], null);
});})(map__6815,map__6815__$1,keys,key,spec_val,status_val,vec__6811,seq__6812,first__6813,seq__6812__$1,_,first__6813__$1,seq__6812__$2,action,ks))
,cljs.core.group_by.call(null,((function (map__6815,map__6815__$1,keys,key,spec_val,status_val,vec__6811,seq__6812,first__6813,seq__6812__$1,_,first__6813__$1,seq__6812__$2,action,ks){
return (function (p1__6807_SHARP_){
return papiea_lib_clj.core.get_in_SINGLEQUOTE_.call(null,p1__6807_SHARP_,ks);
});})(map__6815,map__6815__$1,keys,key,spec_val,status_val,vec__6811,seq__6812,first__6813,seq__6812__$1,_,first__6813__$1,seq__6812__$2,action,ks))
,cljs.core.into.call(null,cljs.core.mapv.call(null,((function (map__6815,map__6815__$1,keys,key,spec_val,status_val,vec__6811,seq__6812,first__6813,seq__6812__$1,_,first__6813__$1,seq__6812__$2,action,ks){
return (function (p1__6808_SHARP_){
return cljs.core.assoc.call(null,p1__6808_SHARP_,new cljs.core.Keyword("papiea","spec","papiea/spec",-681531957),true);
});})(map__6815,map__6815__$1,keys,key,spec_val,status_val,vec__6811,seq__6812,first__6813,seq__6812__$1,_,first__6813__$1,seq__6812__$2,action,ks))
,spec_val),cljs.core.mapv.call(null,((function (map__6815,map__6815__$1,keys,key,spec_val,status_val,vec__6811,seq__6812,first__6813,seq__6812__$1,_,first__6813__$1,seq__6812__$2,action,ks){
return (function (p1__6809_SHARP_){
return cljs.core.assoc.call(null,p1__6809_SHARP_,new cljs.core.Keyword("papiea","status","papiea/status",1076245033),true);
});})(map__6815,map__6815__$1,keys,key,spec_val,status_val,vec__6811,seq__6812,first__6813,seq__6812__$1,_,first__6813__$1,seq__6812__$2,action,ks))
,status_val))))));
});})(vec__6811,seq__6812,first__6813,seq__6812__$1,_,first__6813__$1,seq__6812__$2,action,ks))
,results));
});
;})(vec__6811,seq__6812,first__6813,seq__6812__$1,_,first__6813__$1,seq__6812__$2,action,ks))
}));
cljs.core._add_method.call(null,papiea_lib_clj.core.sfs_compiler,new cljs.core.Keyword("papiea","complex","papiea/complex",-1849732957),(function (p__6824){
var vec__6825 = p__6824;
var seq__6826 = cljs.core.seq.call(null,vec__6825);
var first__6827 = cljs.core.first.call(null,seq__6826);
var seq__6826__$1 = cljs.core.next.call(null,seq__6826);
var _ = first__6827;
var cmds = seq__6826__$1;
var cs = cljs.core.mapv.call(null,papiea_lib_clj.core.sfs_compiler,cmds);
return ((function (cs,vec__6825,seq__6826,first__6827,seq__6826__$1,_,cmds){
return (function (results){
return cljs.core.reduce.call(null,((function (cs,vec__6825,seq__6826,first__6827,seq__6826__$1,_,cmds){
return (function (o,f){
return f.call(null,o);
});})(cs,vec__6825,seq__6826,first__6827,seq__6826__$1,_,cmds))
,results,cs);
});
;})(cs,vec__6825,seq__6826,first__6827,seq__6826__$1,_,cmds))
}));
papiea_lib_clj.core.subset = (function papiea_lib_clj$core$subset(a,b){
return cljs.core._EQ_.call(null,cljs.core.select_keys.call(null,b,cljs.core.keys.call(null,a)),a);
});
cljs.core._add_method.call(null,papiea_lib_clj.core.sfs_compiler,new cljs.core.Keyword("papiea","group","papiea/group",1614236774),(function (p__6829){
var vec__6830 = p__6829;
var seq__6831 = cljs.core.seq.call(null,vec__6830);
var first__6832 = cljs.core.first.call(null,seq__6831);
var seq__6831__$1 = cljs.core.next.call(null,seq__6831);
var _ = first__6832;
var cmds = seq__6831__$1;
var cs = cljs.core.mapv.call(null,papiea_lib_clj.core.sfs_compiler,cmds);
return ((function (cs,vec__6830,seq__6831,first__6832,seq__6831__$1,_,cmds){
return (function (results){
var prior_ids = cljs.core.into.call(null,cljs.core.PersistentHashSet.EMPTY,cljs.core.map.call(null,new cljs.core.Keyword(null,"keys","keys",1068423698),results));
var rs = cljs.core.mapcat.call(null,((function (prior_ids,cs,vec__6830,seq__6831,first__6832,seq__6831__$1,_,cmds){
return (function (f){
return papiea_lib_clj.core.filter_diff.call(null,f.call(null,results));
});})(prior_ids,cs,vec__6830,seq__6831,first__6832,seq__6831__$1,_,cmds))
,cs);
return cljs.core.vec.call(null,cljs.core.apply.call(null,cljs.core.concat,cljs.core.filter.call(null,((function (prior_ids,rs,cs,vec__6830,seq__6831,first__6832,seq__6831__$1,_,cmds){
return (function (p1__6828_SHARP_){
return cljs.core._EQ_.call(null,cljs.core.count.call(null,cs),cljs.core.count.call(null,cljs.core.group_by.call(null,new cljs.core.Keyword(null,"key","key",-1516042587),p1__6828_SHARP_)));
});})(prior_ids,rs,cs,vec__6830,seq__6831,first__6832,seq__6831__$1,_,cmds))
,cljs.core.map.call(null,((function (prior_ids,rs,cs,vec__6830,seq__6831,first__6832,seq__6831__$1,_,cmds){
return (function (id){
return cljs.core.filter.call(null,((function (prior_ids,rs,cs,vec__6830,seq__6831,first__6832,seq__6831__$1,_,cmds){
return (function (y){
return papiea_lib_clj.core.subset.call(null,id,new cljs.core.Keyword(null,"keys","keys",1068423698).cljs$core$IFn$_invoke$arity$1(y));
});})(prior_ids,rs,cs,vec__6830,seq__6831,first__6832,seq__6831__$1,_,cmds))
,rs);
});})(prior_ids,rs,cs,vec__6830,seq__6831,first__6832,seq__6831__$1,_,cmds))
,prior_ids))));
});
;})(cs,vec__6830,seq__6831,first__6832,seq__6831__$1,_,cmds))
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
var sfs_fn = (function (){var G__6833 = sfs_signature;
var G__6833__$1 = (((G__6833 == null))?null:papiea_lib_clj.core.parse_sfs.call(null,G__6833));
var G__6833__$2 = (((G__6833__$1 == null))?null:papiea_lib_clj.core.optimize_ast.call(null,G__6833__$1));
if((G__6833__$2 == null)){
return null;
} else {
return papiea_lib_clj.core.sfs_compiler.call(null,G__6833__$2);
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
var len__4641__auto___6835 = arguments.length;
var i__4642__auto___6836 = (0);
while(true){
if((i__4642__auto___6836 < len__4641__auto___6835)){
args__4647__auto__.push((arguments[i__4642__auto___6836]));

var G__6837 = (i__4642__auto___6836 + (1));
i__4642__auto___6836 = G__6837;
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
papiea_lib_clj.core._main.cljs$lang$applyTo = (function (seq6834){
var self__4629__auto__ = this;
return self__4629__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq.call(null,seq6834));
});

cljs.core._STAR_main_cli_fn_STAR_ = papiea_lib_clj.core._main;
