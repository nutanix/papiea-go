goog.addDependency("base.js", ['goog'], []);
goog.addDependency("../cljs/core.js", ['cljs.core'], ['goog.string', 'goog.Uri', 'goog.object', 'goog.math.Integer', 'goog.string.StringBuffer', 'goog.array', 'goog.math.Long']);
goog.addDependency("../clojure/string.js", ['clojure.string'], ['goog.string', 'cljs.core', 'goog.string.StringBuffer']);
goog.addDependency("../cljs/pprint.js", ['cljs.pprint'], ['goog.string', 'cljs.core', 'goog.string.StringBuffer', 'clojure.string']);
goog.addDependency("../cljs/test.js", ['cljs.test'], ['cljs.core', 'cljs.pprint', 'clojure.string']);
goog.addDependency("../instaparse/util.js", ['instaparse.util'], ['cljs.core']);
goog.addDependency("../instaparse/auto_flatten_seq.js", ['instaparse.auto_flatten_seq'], ['cljs.core']);
goog.addDependency("../instaparse/reduction.js", ['instaparse.reduction'], ['cljs.core', 'instaparse.util', 'instaparse.auto_flatten_seq']);
goog.addDependency("../instaparse/combinators_source.js", ['instaparse.combinators_source'], ['instaparse.reduction', 'cljs.core', 'instaparse.util']);
goog.addDependency("../instaparse/print.js", ['instaparse.print'], ['cljs.core', 'clojure.string']);
goog.addDependency("../instaparse/failure.js", ['instaparse.failure'], ['instaparse.print', 'cljs.core']);
goog.addDependency("../instaparse/gll.js", ['instaparse.gll'], ['instaparse.combinators_source', 'instaparse.print', 'instaparse.reduction', 'cljs.core', 'goog.i18n.uChar', 'instaparse.util', 'instaparse.auto_flatten_seq', 'instaparse.failure']);
goog.addDependency("../instaparse/transform.js", ['instaparse.transform'], ['cljs.core', 'instaparse.util', 'instaparse.gll']);
goog.addDependency("../instaparse/line_col.js", ['instaparse.line_col'], ['cljs.core', 'instaparse.transform', 'instaparse.util']);
goog.addDependency("../cljs/tools/reader/impl/utils.js", ['cljs.tools.reader.impl.utils'], ['goog.string', 'cljs.core', 'clojure.string']);
goog.addDependency("../cljs/tools/reader/reader_types.js", ['cljs.tools.reader.reader_types'], ['goog.string', 'cljs.core', 'goog.string.StringBuffer', 'cljs.tools.reader.impl.utils']);
goog.addDependency("../cljs/tools/reader/impl/inspect.js", ['cljs.tools.reader.impl.inspect'], ['cljs.core']);
goog.addDependency("../cljs/tools/reader/impl/errors.js", ['cljs.tools.reader.impl.errors'], ['cljs.core', 'cljs.tools.reader.reader_types', 'cljs.tools.reader.impl.inspect', 'clojure.string']);
goog.addDependency("../cljs/tools/reader/impl/commons.js", ['cljs.tools.reader.impl.commons'], ['cljs.tools.reader.impl.errors', 'cljs.core', 'cljs.tools.reader.reader_types', 'cljs.tools.reader.impl.utils']);
goog.addDependency("../cljs/tools/reader.js", ['cljs.tools.reader'], ['cljs.tools.reader.impl.commons', 'goog.string', 'cljs.tools.reader.impl.errors', 'cljs.core', 'cljs.tools.reader.reader_types', 'goog.string.StringBuffer', 'cljs.tools.reader.impl.utils', 'goog.array']);
goog.addDependency("../instaparse/cfg.js", ['instaparse.cfg'], ['instaparse.combinators_source', 'cljs.tools.reader', 'instaparse.reduction', 'cljs.core', 'cljs.tools.reader.reader_types', 'instaparse.util', 'instaparse.gll', 'clojure.string']);
goog.addDependency("../clojure/walk.js", ['clojure.walk'], ['cljs.core']);
goog.addDependency("../instaparse/abnf.js", ['instaparse.abnf'], ['instaparse.combinators_source', 'instaparse.reduction', 'cljs.core', 'instaparse.transform', 'instaparse.cfg', 'instaparse.util', 'goog.string.format', 'instaparse.gll', 'clojure.walk']);
goog.addDependency("../instaparse/viz.js", ['instaparse.viz'], ['cljs.core']);
goog.addDependency("../instaparse/repeat.js", ['instaparse.repeat'], ['instaparse.combinators_source', 'instaparse.reduction', 'cljs.core', 'instaparse.auto_flatten_seq', 'instaparse.failure', 'instaparse.gll', 'instaparse.viz']);
goog.addDependency("../instaparse/core.js", ['instaparse.core'], ['instaparse.combinators_source', 'instaparse.line_col', 'instaparse.print', 'instaparse.reduction', 'cljs.core', 'instaparse.transform', 'instaparse.cfg', 'instaparse.util', 'instaparse.abnf', 'instaparse.failure', 'instaparse.gll', 'instaparse.viz', 'clojure.walk', 'instaparse.repeat']);
goog.addDependency("../8E76FEF.js", ['cljs.nodejs'], ['cljs.core']);
goog.addDependency("../papiea_lib_clj/core.js", ['papiea_lib_clj.core'], ['cljs.core', 'cljs.nodejs', 'instaparse.core']);
goog.addDependency("../papiea_lib_clj/core_test.js", ['papiea_lib_clj.core_test'], ['cljs.core', 'cljs.test', 'instaparse.core', 'papiea_lib_clj.core']);
goog.addDependency("../papiea_lib_clj/main_test.js", ['papiea_lib_clj.main_test'], ['cljs.core', 'cljs.test', 'papiea_lib_clj.core_test']);
goog.addDependency("../AEF573C.js", ['cljs.nodejscli'], ['cljs.core', 'cljs.nodejs', 'goog.object']);
