const fs = require('fs');

const files = [
  'jade/page-contents/skeleton_content.html',
  'jade/page-contents/cascader_content.html',
  'jade/page-contents/steps_content.html'
];
const CONTEXT_WINDOW_SIZE = 40;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/(<div class="code-snippet">)+(?=<pre><code)/g, '<div class="code-snippet">');
  content = content.replace(/<\/code><\/pre>(<\/div>)+/g, '</code></pre></div>');
  content = content.replace(/<pre><code/g, (match, offset, source) => {
    let context = source.slice(Math.max(0, offset - CONTEXT_WINDOW_SIZE), offset);
    return /<div class="code-snippet">\s*$/.test(context)
      ? match
      : '<div class="code-snippet"><pre><code';
  });
  content = content.replace(/<\/code><\/pre>/g, (match, offset, source) => {
    let context = source.slice(
      offset + match.length,
      offset + match.length + CONTEXT_WINDOW_SIZE
    );
    return /^\s*<\/div>/.test(context) ? match : '</code></pre></div>';
  });
  fs.writeFileSync(file, content, 'utf8');
});
console.log('Replaced in files');
