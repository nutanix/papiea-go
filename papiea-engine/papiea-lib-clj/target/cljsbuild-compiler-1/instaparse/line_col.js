// Compiled by ClojureScript 1.10.439 {:target :nodejs}
goog.provide('instaparse.line_col');
goog.require('cljs.core');
goog.require('instaparse.transform');
goog.require('instaparse.util');

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
instaparse.line_col.Cursor = (function (index,line,column,__meta,__extmap,__hash){
this.index = index;
this.line = line;
this.column = column;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
instaparse.line_col.Cursor.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__4301__auto__,k__4302__auto__){
var self__ = this;
var this__4301__auto____$1 = this;
return this__4301__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__4302__auto__,null);
});

instaparse.line_col.Cursor.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__4303__auto__,k7798,else__4304__auto__){
var self__ = this;
var this__4303__auto____$1 = this;
var G__7802 = k7798;
var G__7802__$1 = (((G__7802 instanceof cljs.core.Keyword))?G__7802.fqn:null);
switch (G__7802__$1) {
case "index":
return self__.index;

break;
case "line":
return self__.line;

break;
case "column":
return self__.column;

break;
default:
return cljs.core.get.call(null,self__.__extmap,k7798,else__4304__auto__);

}
});

instaparse.line_col.Cursor.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__4320__auto__,f__4321__auto__,init__4322__auto__){
var self__ = this;
var this__4320__auto____$1 = this;
return cljs.core.reduce.call(null,((function (this__4320__auto____$1){
return (function (ret__4323__auto__,p__7803){
var vec__7804 = p__7803;
var k__4324__auto__ = cljs.core.nth.call(null,vec__7804,(0),null);
var v__4325__auto__ = cljs.core.nth.call(null,vec__7804,(1),null);
return f__4321__auto__.call(null,ret__4323__auto__,k__4324__auto__,v__4325__auto__);
});})(this__4320__auto____$1))
,init__4322__auto__,this__4320__auto____$1);
});

instaparse.line_col.Cursor.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__4315__auto__,writer__4316__auto__,opts__4317__auto__){
var self__ = this;
var this__4315__auto____$1 = this;
var pr_pair__4318__auto__ = ((function (this__4315__auto____$1){
return (function (keyval__4319__auto__){
return cljs.core.pr_sequential_writer.call(null,writer__4316__auto__,cljs.core.pr_writer,""," ","",opts__4317__auto__,keyval__4319__auto__);
});})(this__4315__auto____$1))
;
return cljs.core.pr_sequential_writer.call(null,writer__4316__auto__,pr_pair__4318__auto__,"#instaparse.line-col.Cursor{",", ","}",opts__4317__auto__,cljs.core.concat.call(null,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"index","index",-1531685915),self__.index],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"line","line",212345235),self__.line],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"column","column",2078222095),self__.column],null))], null),self__.__extmap));
});

instaparse.line_col.Cursor.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__7797){
var self__ = this;
var G__7797__$1 = this;
return (new cljs.core.RecordIter((0),G__7797__$1,3,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"index","index",-1531685915),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"column","column",2078222095)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator.call(null,self__.__extmap):cljs.core.nil_iter.call(null))));
});

instaparse.line_col.Cursor.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__4299__auto__){
var self__ = this;
var this__4299__auto____$1 = this;
return self__.__meta;
});

instaparse.line_col.Cursor.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__4296__auto__){
var self__ = this;
var this__4296__auto____$1 = this;
return (new instaparse.line_col.Cursor(self__.index,self__.line,self__.column,self__.__meta,self__.__extmap,self__.__hash));
});

instaparse.line_col.Cursor.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__4305__auto__){
var self__ = this;
var this__4305__auto____$1 = this;
return (3 + cljs.core.count.call(null,self__.__extmap));
});

instaparse.line_col.Cursor.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__4297__auto__){
var self__ = this;
var this__4297__auto____$1 = this;
var h__4159__auto__ = self__.__hash;
if((!((h__4159__auto__ == null)))){
return h__4159__auto__;
} else {
var h__4159__auto____$1 = ((function (h__4159__auto__,this__4297__auto____$1){
return (function (coll__4298__auto__){
return (-1036355234 ^ cljs.core.hash_unordered_coll.call(null,coll__4298__auto__));
});})(h__4159__auto__,this__4297__auto____$1))
.call(null,this__4297__auto____$1);
self__.__hash = h__4159__auto____$1;

return h__4159__auto____$1;
}
});

instaparse.line_col.Cursor.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this7799,other7800){
var self__ = this;
var this7799__$1 = this;
return (((!((other7800 == null)))) && ((this7799__$1.constructor === other7800.constructor)) && (cljs.core._EQ_.call(null,this7799__$1.index,other7800.index)) && (cljs.core._EQ_.call(null,this7799__$1.line,other7800.line)) && (cljs.core._EQ_.call(null,this7799__$1.column,other7800.column)) && (cljs.core._EQ_.call(null,this7799__$1.__extmap,other7800.__extmap)));
});

instaparse.line_col.Cursor.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__4310__auto__,k__4311__auto__){
var self__ = this;
var this__4310__auto____$1 = this;
if(cljs.core.contains_QMARK_.call(null,new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"index","index",-1531685915),null,new cljs.core.Keyword(null,"column","column",2078222095),null,new cljs.core.Keyword(null,"line","line",212345235),null], null), null),k__4311__auto__)){
return cljs.core.dissoc.call(null,cljs.core._with_meta.call(null,cljs.core.into.call(null,cljs.core.PersistentArrayMap.EMPTY,this__4310__auto____$1),self__.__meta),k__4311__auto__);
} else {
return (new instaparse.line_col.Cursor(self__.index,self__.line,self__.column,self__.__meta,cljs.core.not_empty.call(null,cljs.core.dissoc.call(null,self__.__extmap,k__4311__auto__)),null));
}
});

instaparse.line_col.Cursor.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__4308__auto__,k__4309__auto__,G__7797){
var self__ = this;
var this__4308__auto____$1 = this;
var pred__7807 = cljs.core.keyword_identical_QMARK_;
var expr__7808 = k__4309__auto__;
if(cljs.core.truth_(pred__7807.call(null,new cljs.core.Keyword(null,"index","index",-1531685915),expr__7808))){
return (new instaparse.line_col.Cursor(G__7797,self__.line,self__.column,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_(pred__7807.call(null,new cljs.core.Keyword(null,"line","line",212345235),expr__7808))){
return (new instaparse.line_col.Cursor(self__.index,G__7797,self__.column,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_(pred__7807.call(null,new cljs.core.Keyword(null,"column","column",2078222095),expr__7808))){
return (new instaparse.line_col.Cursor(self__.index,self__.line,G__7797,self__.__meta,self__.__extmap,null));
} else {
return (new instaparse.line_col.Cursor(self__.index,self__.line,self__.column,self__.__meta,cljs.core.assoc.call(null,self__.__extmap,k__4309__auto__,G__7797),null));
}
}
}
});

instaparse.line_col.Cursor.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__4313__auto__){
var self__ = this;
var this__4313__auto____$1 = this;
return cljs.core.seq.call(null,cljs.core.concat.call(null,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"index","index",-1531685915),self__.index,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"line","line",212345235),self__.line,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"column","column",2078222095),self__.column,null))], null),self__.__extmap));
});

instaparse.line_col.Cursor.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__4300__auto__,G__7797){
var self__ = this;
var this__4300__auto____$1 = this;
return (new instaparse.line_col.Cursor(self__.index,self__.line,self__.column,G__7797,self__.__extmap,self__.__hash));
});

instaparse.line_col.Cursor.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__4306__auto__,entry__4307__auto__){
var self__ = this;
var this__4306__auto____$1 = this;
if(cljs.core.vector_QMARK_.call(null,entry__4307__auto__)){
return this__4306__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth.call(null,entry__4307__auto__,(0)),cljs.core._nth.call(null,entry__4307__auto__,(1)));
} else {
return cljs.core.reduce.call(null,cljs.core._conj,this__4306__auto____$1,entry__4307__auto__);
}
});

instaparse.line_col.Cursor.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"index","index",108845612,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"int","int",-100885395,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"line","line",1852876762,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"long","long",1469079434,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"column","column",-576213674,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"long","long",1469079434,null)], null))], null);
});

instaparse.line_col.Cursor.cljs$lang$type = true;

instaparse.line_col.Cursor.cljs$lang$ctorPrSeq = (function (this__4344__auto__){
return (new cljs.core.List(null,"instaparse.line-col/Cursor",null,(1),null));
});

instaparse.line_col.Cursor.cljs$lang$ctorPrWriter = (function (this__4344__auto__,writer__4345__auto__){
return cljs.core._write.call(null,writer__4345__auto__,"instaparse.line-col/Cursor");
});

/**
 * Positional factory function for instaparse.line-col/Cursor.
 */
instaparse.line_col.__GT_Cursor = (function instaparse$line_col$__GT_Cursor(index,line,column){
return (new instaparse.line_col.Cursor(index,line,column,null,null,null));
});

/**
 * Factory function for instaparse.line-col/Cursor, taking a map of keywords to field values.
 */
instaparse.line_col.map__GT_Cursor = (function instaparse$line_col$map__GT_Cursor(G__7801){
var extmap__4340__auto__ = (function (){var G__7810 = cljs.core.dissoc.call(null,G__7801,new cljs.core.Keyword(null,"index","index",-1531685915),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"column","column",2078222095));
if(cljs.core.record_QMARK_.call(null,G__7801)){
return cljs.core.into.call(null,cljs.core.PersistentArrayMap.EMPTY,G__7810);
} else {
return G__7810;
}
})();
return (new instaparse.line_col.Cursor(new cljs.core.Keyword(null,"index","index",-1531685915).cljs$core$IFn$_invoke$arity$1(G__7801),new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(G__7801),new cljs.core.Keyword(null,"column","column",2078222095).cljs$core$IFn$_invoke$arity$1(G__7801),null,cljs.core.not_empty.call(null,extmap__4340__auto__),null));
});

instaparse.line_col.advance_cursor = (function instaparse$line_col$advance_cursor(cursor,text,new_index){
var new_index__$1 = (new_index | (0));
if((cursor.index <= new_index__$1)){
} else {
throw (new Error("Assert failed: (<= (.-index cursor) new-index)"));
}

if(cljs.core._EQ_.call(null,cursor.index,new_index__$1)){
return cursor;
} else {
var index = cursor.index;
var line = cursor.line;
var column = cursor.column;
while(true){
if(cljs.core._EQ_.call(null,index,new_index__$1)){
return (new instaparse.line_col.Cursor(index,line,column,null,null,null));
} else {
if(cljs.core._EQ_.call(null,text.charAt(index),"\n")){
var G__7812 = (index + (1));
var G__7813 = (line + (1));
var G__7814 = (1);
index = G__7812;
line = G__7813;
column = G__7814;
continue;
} else {
var G__7815 = (index + (1));
var G__7816 = line;
var G__7817 = (column + (1));
index = G__7815;
line = G__7816;
column = G__7817;
continue;

}
}
break;
}
}
});
/**
 * Given a string `text`, returns a function that takes an index into the string,
 * and returns a cursor, including line and column information.  For efficiency,
 * inputs must be fed into the function in increasing order.
 */
instaparse.line_col.make_line_col_fn = (function instaparse$line_col$make_line_col_fn(text){
var cursor_state = cljs.core.atom.call(null,(new instaparse.line_col.Cursor((0),(1),(1),null,null,null)));
return ((function (cursor_state){
return (function instaparse$line_col$make_line_col_fn_$_line_col(i){
cljs.core.swap_BANG_.call(null,cursor_state,instaparse.line_col.advance_cursor,text,i);

return cljs.core.deref.call(null,cursor_state);
});
;})(cursor_state))
});
instaparse.line_col.hiccup_add_line_col_spans = (function instaparse$line_col$hiccup_add_line_col_spans(line_col_fn,parse_tree){
var m = cljs.core.meta.call(null,parse_tree);
var start_index = new cljs.core.Keyword("instaparse.gll","start-index","instaparse.gll/start-index",404653620).cljs$core$IFn$_invoke$arity$1(m);
var end_index = new cljs.core.Keyword("instaparse.gll","end-index","instaparse.gll/end-index",-1851404441).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_((function (){var and__4036__auto__ = start_index;
if(cljs.core.truth_(and__4036__auto__)){
return end_index;
} else {
return and__4036__auto__;
}
})())){
var start_cursor = line_col_fn.call(null,start_index);
var children = cljs.core.doall.call(null,cljs.core.map.call(null,cljs.core.partial.call(null,instaparse.line_col.hiccup_add_line_col_spans,line_col_fn),cljs.core.next.call(null,parse_tree)));
var end_cursor = line_col_fn.call(null,end_index);
return cljs.core.with_meta.call(null,cljs.core.into.call(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first.call(null,parse_tree)], null),children),cljs.core.merge.call(null,cljs.core.meta.call(null,parse_tree),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("instaparse.gll","start-line","instaparse.gll/start-line",768862483),new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(start_cursor),new cljs.core.Keyword("instaparse.gll","start-column","instaparse.gll/start-column",-1490883898),new cljs.core.Keyword(null,"column","column",2078222095).cljs$core$IFn$_invoke$arity$1(start_cursor),new cljs.core.Keyword("instaparse.gll","end-line","instaparse.gll/end-line",-1706020282),new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(end_cursor),new cljs.core.Keyword("instaparse.gll","end-column","instaparse.gll/end-column",942330297),new cljs.core.Keyword(null,"column","column",2078222095).cljs$core$IFn$_invoke$arity$1(end_cursor)], null)));
} else {
return parse_tree;
}
});
instaparse.line_col.enlive_add_line_col_spans = (function instaparse$line_col$enlive_add_line_col_spans(line_col_fn,parse_tree){
var m = cljs.core.meta.call(null,parse_tree);
var start_index = new cljs.core.Keyword("instaparse.gll","start-index","instaparse.gll/start-index",404653620).cljs$core$IFn$_invoke$arity$1(m);
var end_index = new cljs.core.Keyword("instaparse.gll","end-index","instaparse.gll/end-index",-1851404441).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_((function (){var and__4036__auto__ = start_index;
if(cljs.core.truth_(and__4036__auto__)){
return end_index;
} else {
return and__4036__auto__;
}
})())){
var start_cursor = line_col_fn.call(null,start_index);
var children = cljs.core.doall.call(null,cljs.core.map.call(null,cljs.core.partial.call(null,instaparse.line_col.enlive_add_line_col_spans,line_col_fn),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(parse_tree)));
var end_cursor = line_col_fn.call(null,end_index);
return cljs.core.with_meta.call(null,cljs.core.assoc.call(null,parse_tree,new cljs.core.Keyword(null,"content","content",15833224),children),cljs.core.merge.call(null,cljs.core.meta.call(null,parse_tree),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("instaparse.gll","start-line","instaparse.gll/start-line",768862483),new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(start_cursor),new cljs.core.Keyword("instaparse.gll","start-column","instaparse.gll/start-column",-1490883898),new cljs.core.Keyword(null,"column","column",2078222095).cljs$core$IFn$_invoke$arity$1(start_cursor),new cljs.core.Keyword("instaparse.gll","end-line","instaparse.gll/end-line",-1706020282),new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(end_cursor),new cljs.core.Keyword("instaparse.gll","end-column","instaparse.gll/end-column",942330297),new cljs.core.Keyword(null,"column","column",2078222095).cljs$core$IFn$_invoke$arity$1(end_cursor)], null)));
} else {
return parse_tree;
}
});
/**
 * Given a string `text` and a `parse-tree` for text, return parse tree
 * with its metadata annotated with line and column info. The info can
 * then be found in the metadata map under the keywords:
 *  
 * :instaparse.gll/start-line, :instaparse.gll/start-column,
 * :instaparse.gll/end-line, :instaparse.gll/end-column
 * 
 * The start is inclusive, the end is exclusive. Lines and columns are 1-based.
 */
instaparse.line_col.add_line_col_spans = (function instaparse$line_col$add_line_col_spans(text,parse_tree){
var line_col_fn = instaparse.line_col.make_line_col_fn.call(null,text);
if((parse_tree == null)){
return null;
} else {
if(cljs.core.truth_((function (){var and__4036__auto__ = cljs.core.map_QMARK_.call(null,parse_tree);
if(and__4036__auto__){
return new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(parse_tree);
} else {
return and__4036__auto__;
}
})())){
return instaparse.line_col.enlive_add_line_col_spans.call(null,line_col_fn,parse_tree);
} else {
if(((cljs.core.vector_QMARK_.call(null,parse_tree)) && ((cljs.core.first.call(null,parse_tree) instanceof cljs.core.Keyword)))){
return instaparse.line_col.hiccup_add_line_col_spans.call(null,line_col_fn,parse_tree);
} else {
if(cljs.core.truth_((function (){var and__4036__auto__ = cljs.core.sequential_QMARK_.call(null,parse_tree);
if(and__4036__auto__){
var and__4036__auto____$1 = cljs.core.map_QMARK_.call(null,cljs.core.first.call(null,parse_tree));
if(and__4036__auto____$1){
return new cljs.core.Keyword(null,"tag","tag",-1290361223).cljs$core$IFn$_invoke$arity$1(cljs.core.first.call(null,parse_tree));
} else {
return and__4036__auto____$1;
}
} else {
return and__4036__auto__;
}
})())){
return instaparse.transform.map_preserving_meta.call(null,cljs.core.partial.call(null,instaparse.line_col.enlive_add_line_col_spans,line_col_fn),parse_tree);
} else {
if(((cljs.core.sequential_QMARK_.call(null,parse_tree)) && (cljs.core.vector_QMARK_.call(null,cljs.core.first.call(null,parse_tree))) && ((cljs.core.first.call(null,cljs.core.first.call(null,parse_tree)) instanceof cljs.core.Keyword)))){
return instaparse.transform.map_preserving_meta.call(null,cljs.core.partial.call(null,instaparse.line_col.hiccup_add_line_col_spans,line_col_fn),parse_tree);
} else {
if((parse_tree instanceof instaparse.gll.Failure)){
return parse_tree;
} else {
return instaparse.util.throw_illegal_argument_exception.call(null,"Invalid parse-tree, not recognized as either enlive or hiccup format.");

}
}
}
}
}
}
});

//# sourceMappingURL=line_col.js.map
