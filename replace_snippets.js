const fs = require('fs');

const files = [
  'jade/page-contents/skeleton_content.html',
  'jade/page-contents/cascader_content.html',
  'jade/page-contents/steps_content.html'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<pre><code/g, '<div class="code-snippet"><pre><code');
  content = content.replace(/<\/code><\/pre>/g, '</code></pre></div>');
  fs.writeFileSync(file, content, 'utf8');
});
console.log('Replaced in files');