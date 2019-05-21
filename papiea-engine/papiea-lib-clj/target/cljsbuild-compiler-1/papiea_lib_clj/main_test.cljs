(ns papiea-lib-clj.main-test
  (:require [cljs.test :refer [run-tests]]
            [papiea-lib-clj.core-test :as core]))

;; Turn on console printing. Node can't print to *out* without.
(enable-console-print!)

; This must be a root level call for Node to pick it up.
(run-tests 'papiea-lib-clj.core-test)
