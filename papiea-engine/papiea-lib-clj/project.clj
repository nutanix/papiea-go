(defproject nutanix.cto/papiea-lib-clj "0.1.0-SNAPSHOT"
  :description "FIXME: write this!"
  :url "http://example.com/FIXME"

  :dependencies [[org.clojure/clojure "1.9.0"]
                 [org.clojure/clojurescript "1.10.439"]
                 [instaparse "1.4.9"]
                 [cider/piggieback "0.3.10"]]

  :plugins [[lein-cljsbuild "1.1.7"]]
  :repl-options {:nrepl-middleware [cider.piggieback/wrap-cljs-repl]}
  
  :source-paths ["src"]
  :test-paths ["test"]

  :aliases {"cljs-test"      ["cljsbuild" "test" "unit-tests"]
            "test-all"       ["do" "clean," "test," "cljsbuild" "once"]
            "cljs-auto-test" ["cljsbuild" "auto" "tests"]}

  :cljsbuild {:builds {:production {:source-paths ["src"]
                                    :compiler     {:target        :nodejs
                                                   :output-to     "papiea-lib-clj.js"
                                                   :optimizations :simple}}
                       
                       :tests {:source-paths   ["src" "test"]
                               :notify-command ["node" "target/unit-tests.js"]
                               :compiler       {:output-to     "target/unit-tests.js"
                                                :optimizations :none
                                                :target        :nodejs
                                                :main          papiea-lib-clj.main-test}}}
              
              :test-commands {"unit-tests" ["node" "target/unit-tests.js"]}})
