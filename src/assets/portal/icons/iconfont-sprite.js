((window._iconfont_svg_string_ =
  '<svg><symbol id="icon-shoucang" viewBox="0 0 1024 1024"><path d="M912.594 565.068c43.926-71.89 58.216-160.956 39.11-243.768-40.812-188.64-266.872-265.724-407.676-139.308-11.134 9.944-21.056 21.41-32.032 32.842-10.976-11.432-20.9-22.898-32.032-32.842C339.16 55.576 113.1 132.66 72.288 321.3c-19.106 82.812-4.816 171.878 39.11 243.768 76.876 126 200.814 224.102 321.728 313.03 46.95 34.518 110.79 34.518 157.762 0 120.892-88.928 244.83-187.032 321.706-313.03z" fill="#FF7B7B" ></path><path d="M933.918 677.37c24.17-39.378 32.032-88.16 21.526-133.52-22.466-103.32-146.786-145.54-224.22-76.3-6.14 5.448-11.604 11.726-17.63 17.99-6.026-6.264-11.492-12.542-17.628-17.99-77.436-69.24-201.756-27.02-224.222 76.3-10.506 45.36-2.644 94.142 21.526 133.52 40.252 65.722 104 117.602 167.416 164.44 31.36 23.184 74.456 23.184 105.816 0 63.414-46.838 127.164-98.72 167.416-164.44z" fill="#FFB0B0" ></path></symbol></svg>'),
  (function (e) {
    var t = (t = document.getElementsByTagName("script"))[t.length - 1],
      l = t.getAttribute("data-injectcss"),
      t = t.getAttribute("data-disable-injectsvg");
    if (!t) {
      var c,
        a,
        i,
        n,
        o,
        d = function (t, l) {
          l.parentNode.insertBefore(t, l);
        };
      if (l && !e.__iconfont__svg__cssinject__) {
        e.__iconfont__svg__cssinject__ = !0;
        try {
          document.write(
            "<style>.svgfont {display: inline-block;width: 1em;height: 1em;fill: currentColor;vertical-align: -0.1em;font-size:16px;}</style>"
          );
        } catch (t) {
          console && console.log(t);
        }
      }
      ((c = function () {
        var t,
          l = document.createElement("div");
        ((l.innerHTML = e._iconfont_svg_string_),
          (l = l.getElementsByTagName("svg")[0]) &&
            (l.setAttribute("aria-hidden", "true"),
            (l.style.position = "absolute"),
            (l.style.width = 0),
            (l.style.height = 0),
            (l.style.overflow = "hidden"),
            (l = l),
            (t = document.body).firstChild
              ? d(l, t.firstChild)
              : t.appendChild(l)));
      }),
        document.addEventListener
          ? ~["complete", "loaded", "interactive"].indexOf(document.readyState)
            ? setTimeout(c, 0)
            : ((a = function () {
                (document.removeEventListener("DOMContentLoaded", a, !1), c());
              }),
              document.addEventListener("DOMContentLoaded", a, !1))
          : document.attachEvent &&
            ((i = c),
            (n = e.document),
            (o = !1),
            s(),
            (n.onreadystatechange = function () {
              "complete" == n.readyState &&
                ((n.onreadystatechange = null), h());
            })));
    }
    function h() {
      o || ((o = !0), i());
    }
    function s() {
      try {
        n.documentElement.doScroll("left");
      } catch (t) {
        return void setTimeout(s, 50);
      }
      h();
    }
  })(window));
