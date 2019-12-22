/*jslint nomen: true, indent: 2, maxlen: 80 */
/*global window, rJS, RSVP, Math */
(function (window, rJS, RSVP, Math) {
    "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var STR = "";
  var ACTIVE = "is-active";
  var KLASS = rJS(window);
  var CANVAS = "canvas";
  var ARR = [];
  var BLANK = "_blank";
  var NAME = "name";
  var VOLT = "volt_jio";
  var DIALOG_ACTIVE = "volt-dialog-active";
  var LOCATION = window.location;
  var DOCUMENT = window.document;
  var HIDDEN = "volt-hidden";
  var INTERSECTION_OBSERVER = window.IntersectionObserver;
  var TEMPLATE_PARSER = /\{([^{}]*)\}/g;
  var LANG = "https://raw.githubusercontent.com/VoltEuropa/MerryVolt/master/lang/";
  var MAP_CONFIG = {
    "map_id": "stardust"
  };

  /////////////////////////////
  // methods
  /////////////////////////////
  function setCookie (name, value, days, session_only) {
    var d;
    if (session_only) {
      DOCUMENT.cookie = name + "=" + value + ";path=/;";
    }
    d = new Date();
    d.setTime(d.getTime() + 24*60*60*1000*days);
    DOCUMENT.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
  }

  function getCookie(name) {
    var v = DOCUMENT.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
  }

  function getElem(my_element, my_selector) {
    return my_element.querySelector(my_selector);
  }

  function mergeDict(my_return_dict, my_new_dict) {
    return Object.keys(my_new_dict).reduce(function (pass_dict, key) {
      pass_dict[key] = my_new_dict[key];
      return pass_dict;
    }, my_return_dict);
  }

  // poor man's templates. thx, http://javascript.crockford.com/remedial.html
  if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
      return this.replace(TEMPLATE_PARSER, function (a, b) {
        var r = o[b];
        return typeof r === "string" || typeof r === "number" ? r : a;
      });
    };
  }

  function getTemplate(my_klass, my_id) {
    return my_klass.__template_element.getElementById(my_id).innerHTML;
  }

  function purgeDom(my_node) {
    while (my_node.firstChild) {
      my_node.removeChild(my_node.firstChild);
    }
  }

  function setDom(my_node, my_string, my_purge) {
    var faux_element = DOCUMENT.createElement(CANVAS);
    if (my_purge) {
      purgeDom(my_node);
    }
    faux_element.innerHTML = my_string;
    ARR.slice.call(faux_element.children).forEach(function (element) {
      my_node.appendChild(element);
    });
  }

  function getLang(nav) {
    return (nav.languages ? nav.languages[0] : (nav.language || nav.userLanguage));
  }

  function getConfig(my_language) {
    return {
      "type": "volt_storage",
      "repo": "MerryLille",
      "path": "lang/" + my_language,
      "__debug": "https://softinst103163.host.vifib.net/public/MyStarForEurope/lang/" + my_language + "/debug.json"
    };
  }

  KLASS

    /////////////////////////////
    // state
    /////////////////////////////
    .setState({
      "locale": getLang(window.navigator).substring(0, 2) || "en",
      "online": null,
      "sw_errors": 0
    })

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      var element = gadget.element;
      gadget.property_dict = {
        "dialog": getElem(gadget.element, ".volt-dialog"),
        "dialog_content": getElem(gadget.element, ".volt-dialog-content"),
        "consent_wrapper": getElem(gadget.element,".volt-cookie__notice-wrapper"),

        // yaya, should be localstorage caling repair to sync
        "url_dict": {},
        "content_dict": {},
        "i18n_dict": {}
      };
    })

    /////////////////////////////
    // acquired methods
    /////////////////////////////
    .declareAcquiredMethod("translateDom", "translateDom")

    /////////////////////////////
    // published methods
    /////////////////////////////
    // to keep map gadget generic, content specific parameters are set here
    .allowPublicAcquisition("setMarkerContent", function (my_payload) {
      var gadget = this;
      var dict = gadget.property_dict;
      /*
      var url_dict = setMapParameterDict(my_payload[1], dict.marker_dict);
      var response = {};

      response.zoom = url_dict.zoom;
      response.position = url_dict.position;
      response.entry_list = url_dict.city_list.map(function (city) { 
        return {
          "content": getTemplate(KLASS, my_payload[0]).supplant({
            "city_name": dict.ui_dict[city.i18n],
            "facebook_url": city.facebook_url || STR,
            "facebook_disabled": city.facebook_url === undefined ? LINK_DISABLED : STR,
            "facebook_group": city.facebook_group_url ? getTemplate(KLASS, "facebook_group_template").supplant({
              "facebook_group_url": city.facebook_group_url,
              "facebook_group_disabled": city.facebook_group_url ? LINK_DISABLED : STR
            }) : STR,
            "contact_url": city.contact_url ? getTemplate(KLASS, "city_mail_template").supplant({
              "contact_url": city.contact_url
            }) : STR,
            "lead_url": city.lead_url ? getTemplate(KLASS, "lead_mail_template").supplant({
              "lead_url": city.lead_url
            }) : STR,
            "twitter_url": city.twitter_url || STR,
            "twitter_disabled": city.twitter_url === undefined ? LINK_DISABLED : STR,
            "web_url": city.web_url || STR,
            "web_disabled": city.web_url === undefined ? LINK_DISABLED : STR
          }),
          "position": city.position
        };
      });
      return response;
      */
      return {"entry_list": []};
    })

    // bäh...
    .allowPublicAcquisition("updateMapState", function (my_payload) {
      var gadget = this;
      var dict = gadget.property_dict;
      /*
      var url_dict = setMapParameterDict(my_payload[0], dict.marker_dict);
      var link_list = dict.scm_container.querySelectorAll(".volt-link");
      var fb_link = link_list[0];
      var tw_link = link_list[1];
      var web_link = link_list[2];

      if (!!url_dict.facebook_url) {
        fb_link.setAttribute("href", url_dict.facebook_url);
        fb_link.classList.remove(LINK_DISABLED);
      } else {
        fb_link.setAttribute("href", STR);
        fb_link.classList.add(LINK_DISABLED);
      }
      if (!!url_dict.twitter_url) {
        tw_link.setAttribute("href", url_dict.twitter_url);
        tw_link.classList.remove(LINK_DISABLED);
      } else {
        tw_link.setAttribute("href", STR);
        tw_link.classList.add(LINK_DISABLED);
      }
      if (!!url_dict.web_url) {
        web_link.setAttribute("href", url_dict.web_url);
        web_link.classList.remove(LINK_DISABLED);
      } else {
        web_link.setAttribute("href", STR);
        web_link.classList.add(LINK_DISABLED);
      }
      */
    })

    /////////////////////////////
    // declared methods
    /////////////////////////////

    // ---------------------- JIO bridge ---------------------------------------
    .declareMethod("route", function (my_scope, my_call, my_p1, my_p2, my_p3) {
      return this.getDeclaredGadget(my_scope)
        .push(function (my_gadget) {
          return my_gadget[my_call](my_p1, my_p2, my_p3);
        });
    })
    .declareMethod("volt_create", function (my_option_dict) {
      return this.route(VOLT, "createJIO", my_option_dict);
    })
    .declareMethod("volt_get", function (my_id) {
      return this.route(VOLT, "get", my_id);
    })
    .declareMethod("volt_allDocs", function () {
      return this.route(VOLT, "allDocs");
    })

    .declareMethod("stateChange", function (delta) {
      var gadget = this;
      var state = gadget.state;
  
      if (delta.hasOwnProperty("locale")) {
        state.locale = delta.locale;
      }
      return;
    })

    .declareMethod("fetchTranslationAndUpdateDom", function (my_language) {
      var gadget = this;
      var dict = gadget.property_dict;
      var url_dict = dict.url_dict;
      return new RSVP.Queue()
        .push(function () {
          return gadget.volt_get(url_dict.ui);
        })
        .push(function (data) {
          dict.i18n_dict = data;
          return gadget.translateDom(data);
        });
    })

    .declareMethod("updateStorage", function (my_language) {
      var gadget = this;
      if (my_language === gadget.state.locale) {
        return;
      }
      return new RSVP.Queue()
        .push(function () {
          return gadget.stateChange({"locale": my_language});
        })
        .push(function () {
          return gadget.volt_create(getConfig(my_language));
        })
        .push(function () {
          return gadget.buildContentLookupDict();
        })
        .push(function () {
          return gadget.fetchTranslationAndUpdateDom();
        });
    })

    .declareMethod("storeCoookieConsent", function (my_event) {
      var gadget = this;
      setCookie("consent", 1, 60);
      gadget.property_dict.consent_wrapper.classList.add(HIDDEN);
    })

    .declareMethod("buildContentLookupDict", function () {
      var gadget = this;
      var dict = gadget.property_dict;
      return new RSVP.Queue()
        .push(function () {
          return gadget.volt_allDocs();
        })
        .push(function (my_file_list) {
          if (my_file_list.data.total_rows === 0) {
            return gadget.updateStorage("en");
          }
          my_file_list.data.rows.map(function (row) {
            dict.url_dict[row.id.split("/").pop().replace(".json", "")] = row.id;
          });
        })

        // we only need a language to build the dict, so in case of errors like
        // on OS X/Safari 9, which cannot handle Github APIv3 redirect, we just
        // build the damn thing by hand... and fail somewhere else
        .push(undefined, function(whatever) {
          var i;
          for (i = 1; i < 32; i += 1) {
            dict.url_dict[i] = LANG + gadget.state.locale + "/" + i + ".json";
          }
          dict.url_dict["ui"] = LANG + gadget.state.locale + "/ui.json";
        });
    })

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;

      DOCUMENT.body.classList.remove("volt-splash");
      window.componentHandler.upgradeDom();
      mergeDict(dict, my_option_dict);
      return new RSVP.Queue()
        .push(function () {
          return gadget.volt_create(getConfig(gadget.state.locale));
        })
        .push(function () {
          return RSVP.all([
            gadget.buildContentLookupDict(),
            dict.map_gadget.render({"config": MAP_CONFIG})
          ]);
        })
        .push(function () {
          return RSVP.all([
            dict.map_gadget.renderMap(dict.default_language),
            gadget.fetchTranslationAndUpdateDom(gadget.state.locale)
          ]);
        });
    })


    /////////////////////////////
    // declared jobs
    /////////////////////////////

    /////////////////////////////
    // declared service
    /////////////////////////////
    .declareService(function () {
      var body = DOCUMENT.body;
      var seo = body.querySelector(".volt-seo-content");
      if (seo) {
        seo.parentElement.removeChild(seo);
      }
      body.classList.remove("volt-splash");     
    })

    .declareService(function () {
      var gadget = this;
      return new RSVP.Queue()
        .push(function () {
          return gadget.getDeclaredGadget("volt_map");
        })
        .push(function (map_gadget) {
          gadget.property_dict.map_gadget = map_gadget;
        });
    })

    /////////////////////////////
    // declared service
    /////////////////////////////
    .declareService(function () {
      var gadget = this;
      var listener = window.loopEventListener;
      var dict = gadget.property_dict;
      /*
      if (getCookie("init") === null) {
        setCookie("init", 1, 1, true);
      }
      */
      if (getCookie("consent") === null) {

        // quick fix, ensure cookie expiring doesn't break page
        if (dict.consent_wrapper) {
          dict.consent_wrapper.classList.remove(HIDDEN);
        }
      }

      function handleConnection() {
        return gadget.stateChange({"online": window.navigator.onLine});
      }
      return RSVP.all([
        //gadget.installServiceWorker(),
        listener(window, "online", false, handleConnection),
        listener(window, "offline", false, handleConnection),
      ]);
    })

    /////////////////////////////
    // on Event
    /////////////////////////////
    .onEvent("submit", function (event) {
      switch (event.target.getAttribute(NAME)) {
        case "volt-select-language":
          return this.updateStorage(event.target.volt_language.value);
        case "volt-cookie__consent":
          return this.storeCoookieConsent(event.target);
      }
    });


}(window, rJS, RSVP, Math));