$(function () {
  function escape(html) {
    return html.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }
  $('.language-jsx').each(function () {
    var text = escape($(this).text());
    if (text.indexOf('render') === -1) {
      return;
    }
    text = text.replace('\nrender', '\nReactDOM.render');
    text = 'const Form = JSONSchemaForm.default;\n' + text;
    var prefill = {
      title: 'RJSF example',
      tags: [],
      scripts: [
        'https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.production.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/umd/react-dom.production.min.js',
        'https://unpkg.com/@rjsf/core/dist/react-jsonschema-form.js',
      ],
      stylesheets: ['//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css'],
    };
    var div = $(
      '<div><div class="codepen" data-height="400" data-theme-id="light" data-default-tab="js,result" data-prefill=\'' +
        JSON.stringify(prefill) +
        ' \'>"<pre data-lang="html">\n&lt;div id="app">&lt;/div></pre><pre data-lang="babel">' +
        text +
        '</pre></div></div>'
    ).css('margin', '30px 0px');
    $(this).replaceWith(div);
  });

  var url = 'https://static.codepen.io/assets/embed/ei.js';

  var script = document.createElement('script');
  script.onload = function () {
    window.__CPEmbed('.jsx');
  };
  script.src = url;

  document.head.appendChild(script);
});
