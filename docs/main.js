$(function() {
    
$(".jsx").each(function() {
    var text = $(this).text().replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    if (text.indexOf("render") === -1) {
        return;
    }
    text = text.replace("\nrender", "\nReactDOM.render");
    text = "var Form = JSONSchemaForm.default;\n" + text;
    var div = $("<div class=\"codepen\" data-height=\"400\" data-theme-id=\"light\" data-default-tab=\"js,result\" data-prefill='{\"title\":\"RJSF example\",\"tags\":[],\"scripts\":[\"https://cdnjs.cloudflare.com/ajax/libs/react/16.13.1/umd/react.production.min.js\",\"https://cdnjs.cloudflare.com/ajax/libs/react-dom/16.13.1/umd/react-dom.production.min.js\",\"https://unpkg.com/@rjsf/core/dist/react-jsonschema-form.js\"],\"stylesheets\":[]}'>\"<pre data-lang=\"html\">\n&lt;link rel=\"stylesheet\" href=\"//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css\">\n&lt;div id=\"app\">&lt;/div></pre><pre data-lang=\"babel\">" + text + "</pre></div>");
    $(this).replaceWith(div);
});

var url = "https://static.codepen.io/assets/embed/ei.js";

var script = document.createElement('script');
script.onload = function () {
    window.__CPEmbed(".jsx");
};
script.src = url;

document.head.appendChild(script);

});